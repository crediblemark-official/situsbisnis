import { NextResponse } from "next/server";
import { OrderClient } from "@/modules/order";

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

        try {
            await OrderClient.processOrderWebhook(body);
        } catch (err: any) {
            const message = err.message;
            if (message === "Missing parameters") {
                return new NextResponse("Missing parameters", { status: 400 });
            }
            if (message === "Order not found") {
                return new NextResponse("Order not found", { status: 404 });
            }
            if (message === "Site payment not configured") {
                return new NextResponse("Site payment not configured", { status: 500 });
            }
            if (message === "Invalid Signature") {
                return new NextResponse("Invalid Signature", { status: 400 });
            }
            throw err;
        }

        return new NextResponse("OK", {
            status: 200,
            headers: { "Content-Type": "text/plain" }
        });
    } catch (error) {
        console.error("[DUITKU_ORDER_CALLBACK_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

