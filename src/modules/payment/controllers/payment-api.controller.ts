import { NextResponse } from "next/server";
import { PaymentClient } from "../index";

/**
 * Handler POST untuk memproses callback webhook dari Midtrans.
 */
export async function processMidtransWebhookApi(req: Request) {
    try {
        const body = await req.json();

        await PaymentClient.processMidtransWebhook(body);

        // Midtrans expects a 200 status code response (usually OK or empty is fine)
        return new NextResponse("OK", {
            status: 200,
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error: any) {
        console.error("[MIDTRANS_CALLBACK_ERROR]", error);
        if (error.message === "Missing parameters" || error.message === "Invalid Signature") {
            return new NextResponse(error.message, { status: 400 });
        }
        if (error.message === "Platform not configured" || error.message === "Processing error") {
            return new NextResponse(error.message, { status: 500 });
        }
        // ALREADY_PROCESSED = webhook sent duplicate callback, acknowledge it
        if (error.message === "ALREADY_PROCESSED" || error.message === "TRANSACTION_NOT_FOUND") {
            return new NextResponse("OK", {
                status: 200,
                headers: { "Content-Type": "text/plain" }
            });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
