import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let body: Record<string, any> = {};

        if (contentType.includes("application/json")) {
            body = await req.json();
        } else {
            const text = await req.text();
            const params = new URLSearchParams(text);
            body = Object.fromEntries(params.entries());
        }

        const { merchantCode, amount, merchantOrderId, signature, resultCode } = body;

        if (!merchantCode || !amount || !merchantOrderId || !signature) {
            console.warn("[DUITKU_ORDER_CALLBACK] Missing required parameters", body);
            return new NextResponse("Missing parameters", { status: 400 });
        }

        // Handle custom checkout suffixed order IDs (e.g. orderId-method-suffix)
        const actualOrderId = merchantOrderId.includes("-") ? merchantOrderId.split("-")[0] : merchantOrderId;

        // Fetch Order first to identify which subsite/tenant database it belongs to
        const order = await db.order.findUnique({
            where: { id: actualOrderId }
        });

        if (!order) {
            console.warn(`[DUITKU_ORDER_CALLBACK] Order '${actualOrderId}' (from '${merchantOrderId}') not found in database.`);
            return new NextResponse("Order not found", { status: 404 });
        }

        // Fetch subsite's PaymentSettings to verify credentials
        const paymentSettings = await db.paymentSettings.findUnique({
            where: { siteId: order.siteId }
        });

        let activeMerchantCode = paymentSettings?.duitkuMerchantCode;
        let apiKey = paymentSettings?.duitkuApiKey;
        let sandbox = paymentSettings?.duitkuSandbox ?? true;

        if (!activeMerchantCode || !apiKey) {
            // Fallback to platform settings
            const platformSettings = await db.platformSettings.findUnique({
                where: { id: "global" }
            });
            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                activeMerchantCode = platformSettings.duitkuMerchantCode;
                apiKey = platformSettings.duitkuApiKey;
                sandbox = platformSettings.duitkuSandbox;
            } else {
                console.error(`[DUITKU_ORDER_CALLBACK] Duitku merchant keys not configured for siteId: '${order.siteId}' and no platform fallback found.`);
                return new NextResponse("Site payment not configured", { status: 500 });
            }
        }

        // Import and verify using SDK
        const { paymentManager } = await import("@crediblemark/buayar");
        const verification = await paymentManager.verifyCallback("duitku", body, {
            merchantCode: activeMerchantCode || "",
            apiKey,
            sandbox
        });

        if (!verification.isValid) {
            console.warn("[DUITKU_ORDER_CALLBACK] Invalid signature!", { received: signature, body });
            return new NextResponse("Invalid Signature", { status: 400 });
        }

        console.log(`[DUITKU_ORDER_CALLBACK] Verified callback for orderId: '${actualOrderId}' (raw: '${merchantOrderId}'), status: '${verification.status}'`);

        if (verification.status === "paid") {
            // Use database transaction for atomic update of order status and owner balance credit
            await db.$transaction(async (tx) => {
                // 1. Update Order Payment Status
                await tx.order.update({
                    where: { id: actualOrderId },
                    data: {
                        paymentStatus: "paid",
                        status: "processing" // transition order general status to processing
                    }
                });

                // 2. If this site used the platform's payment gateway fallback, credit the owner's balance
                if (!paymentSettings?.duitkuMerchantCode || !paymentSettings?.duitkuApiKey) {
                    const site = await tx.site.findUnique({
                        where: { id: order.siteId },
                        include: { users: { select: { id: true } } }
                    });

                    if (site?.users && site.users.length > 0) {
                        const ownerId = site.users[0].id;
                        await tx.user.update({
                            where: { id: ownerId },
                            data: {
                                affiliateBalance: {
                                    increment: Number(order.total)
                                }
                            }
                        });
                        console.log(`[DUITKU_ORDER_CALLBACK] Platform fallback payment: Credited ${order.total} to owner '${ownerId}' balance.`);
                    }
                }
            });
            console.log(`[DUITKU_ORDER_CALLBACK] Order '${actualOrderId}' paymentStatus updated to paid and owner balance credited.`);
        } else {
            console.info(`[DUITKU_ORDER_CALLBACK] Callback received but payment not completed (resultCode: ${resultCode})`);
        }

        // Duitku expects raw text "OK"
        return new NextResponse("OK", {
            status: 200,
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error) {
        console.error("[DUITKU_ORDER_CALLBACK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
