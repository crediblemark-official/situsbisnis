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

        await BillingClient.processDuitkuWebhook(body);

        // Duitku expects a raw text "OK" response to acknowledge webhook delivery
        return new NextResponse("OK", {
            status: 200,
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error: any) {
        console.error("[DUITKU_CALLBACK_ERROR]", error);
        if (error.message === "Missing parameters" || error.message === "Invalid Signature") {
            return new NextResponse(error.message, { status: 400 });
        }
        if (error.message === "Platform not configured" || error.message === "Processing error") {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

