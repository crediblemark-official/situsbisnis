import { NextResponse } from "next/server";
import { OrderClient } from "@/modules/order";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        try {
            const { methods } = await OrderClient.getOrderPaymentMethods(orderId);
            return NextResponse.json({ methods });
        } catch (err: any) {
            const message = err.message;
            if (message === "Order not found") {
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }
            if (message === "Payment settings not configured") {
                return NextResponse.json({ error: "Payment settings not configured" }, { status: 500 });
            }
            if (message.includes("Failed to fetch payment methods")) {
                console.warn("[SHOP_PAYMENT_METHODS] Failed to fetch from Duitku:", message);
                return NextResponse.json({ error: message }, { status: 502 });
            }
            throw err;
        }
    } catch (error: any) {
        console.error("[SHOP_PAYMENT_METHODS_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

