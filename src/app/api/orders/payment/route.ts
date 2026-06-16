import { NextResponse } from "next/server";
import { OrderClient } from "@/lib/modules/order/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, paymentMethod } = body;

        if (!orderId || !paymentMethod) {
            return NextResponse.json({ error: "orderId and paymentMethod are required" }, { status: 400 });
        }

        const host = req.headers.get("host") || "situsbisnis.com";
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const origin = `${protocol}://${host}`;

        const result = await OrderClient.initializeOrderPayment(orderId, paymentMethod, origin);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ORDER_PAYMENT_INIT_ERROR]", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

