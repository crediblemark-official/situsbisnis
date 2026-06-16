import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";
import { BillingClient } from "@/lib/modules/billing/client";

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
            console.warn("[DUITKU_CALLBACK] Missing required parameters", body);
            return new NextResponse("Missing parameters", { status: 400 });
        }

        // Handle custom checkout suffixed order IDs (e.g. transactionId-method-suffix)
        const actualTransactionId = merchantOrderId.includes("-") ? merchantOrderId.split("-")[0] : merchantOrderId;

        // Fetch Duitku keys from platform settings
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        if (!platformSettings || !platformSettings.duitkuApiKey) {
            console.error("[DUITKU_CALLBACK] Duitku platform keys not configured in database.");
            return new NextResponse("Platform not configured", { status: 500 });
        }

        // Import and verify using SDK
        const { paymentManager } = await import("@crediblemark/buayar");
        const verification = await paymentManager.verifyCallback("duitku", body, {
            merchantCode: platformSettings.duitkuMerchantCode || "",
            apiKey: platformSettings.duitkuApiKey,
            sandbox: platformSettings.duitkuSandbox
        });

        if (!verification.isValid) {
            console.warn("[DUITKU_CALLBACK] Invalid signature!", { received: signature, body });
            return new NextResponse("Invalid Signature", { status: 400 });
        }

        console.log(`[DUITKU_CALLBACK] Verified callback for orderId: '${actualTransactionId}' (raw: '${merchantOrderId}'), status: '${verification.status}'`);

        if (verification.status === "paid") {
            try {
                await BillingClient.processApprovedTransaction(actualTransactionId);
                console.log(`[DUITKU_CALLBACK] Transaction '${actualTransactionId}' approved and activated successfully.`);
            } catch (err: any) {
                if (err.message === "ALREADY_PROCESSED") {
                    console.info(`[DUITKU_CALLBACK] Transaction '${actualTransactionId}' was already processed.`);
                } else {
                    console.error(`[DUITKU_CALLBACK] Error processing transaction approval:`, err);
                    return new NextResponse("Processing error", { status: 500 });
                }
            }
        } else {
            console.info(`[DUITKU_CALLBACK] Callback received but payment not completed (resultCode: ${resultCode})`);
        }

        // Duitku expects a raw text "OK" response to acknowledge webhook delivery
        return new NextResponse("OK", {
            status: 200,
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error) {
        console.error("[DUITKU_CALLBACK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
