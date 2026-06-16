import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        // 1. Fetch Order and its site context
        const order = await db.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const amount = Number(order.total);

        // 2. Fetch site's PaymentSettings to verify credentials
        const paymentSettings = await db.paymentSettings.findUnique({
            where: { siteId: order.siteId }
        });

        // 3. Fetch platform settings for fallback
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        let merchantCode = paymentSettings?.duitkuMerchantCode;
        let apiKey = paymentSettings?.duitkuApiKey;
        let sandbox = paymentSettings?.duitkuSandbox ?? true;

        if (!merchantCode || !apiKey) {
            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                merchantCode = platformSettings.duitkuMerchantCode;
                apiKey = platformSettings.duitkuApiKey;
                sandbox = platformSettings.duitkuSandbox;
            } else {
                return NextResponse.json({ error: "Payment settings not configured" }, { status: 500 });
            }
        }

        const { paymentManager } = await import("@crediblemark/buayar");

        const result = await paymentManager.getPaymentMethods("duitku", {
            amount: Math.round(amount),
        }, {
            merchantCode: merchantCode || "",
            apiKey,
            sandbox,
        });

        if (!result.success) {
            console.warn("[SHOP_PAYMENT_METHODS] Failed to fetch from Duitku:", result.error);
            return NextResponse.json({ error: result.error || "Failed to fetch payment methods" }, { status: 502 });
        }

        const methods = [...result.methods];
        
        // Add manual bank transfer option if manual transfer details are configured on the site
        if (paymentSettings?.bankName && paymentSettings?.accountNumber) {
            methods.push({
                paymentMethod: "manual",
                paymentName: `Transfer Bank Manual (${paymentSettings.bankName})`,
                paymentImage: "/logo-pembayaran/JP.svg",
                totalFee: "0",
                category: "Virtual Account"
            });
        }

        return NextResponse.json({ methods });
    } catch (error: any) {
        console.error("[SHOP_PAYMENT_METHODS_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
