import { NextResponse } from "next/server";
import { OrderClient } from "@/lib/modules/order/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const result = await OrderClient.checkOrderStatus(orderId);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ORDER_CHECK_STATUS]", error);
        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

