import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
            return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
        }

        const { paymentManager } = await import("@crediblemark/buayar");

        const result = await paymentManager.getPaymentMethods("duitku", {
            amount: Math.round(Number(amount)),
        }, {
            merchantCode: platformSettings.duitkuMerchantCode,
            apiKey: platformSettings.duitkuApiKey,
            sandbox: platformSettings.duitkuSandbox,
        });

        if (!result.success) {
            console.warn("[PAYMENT_METHODS] Failed to fetch from Duitku:", result.error);
            return NextResponse.json({ error: result.error || "Failed to fetch payment methods" }, { status: 502 });
        }

        return NextResponse.json({ methods: result.methods });
    } catch (error) {
        console.error("[PAYMENT_METHODS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
