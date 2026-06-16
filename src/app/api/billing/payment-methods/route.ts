import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BillingClient } from "@/modules/billing";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { amount } = body;

        if (!amount || isNaN(Number(amount))) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        const result = await BillingClient.getPaymentMethods(amount);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[PAYMENT_METHODS]", error);
        if (error.message === "Payment gateway not configured") {
            return NextResponse.json({ error: error.message }, { status: 503 });
        }
        return NextResponse.json({ error: error.message || "Failed to fetch payment methods" }, { status: 502 });
    }
}

