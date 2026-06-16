import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PaymentClient } from "@/modules/payment";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { siteId, planId, couponCode, paymentMethod = "manual" } = body;

        if (!siteId || !planId) {
            return new NextResponse("Missing data", { status: 400 });
        }

        console.log(`[UPGRADE] Attempting upgrade for siteId: '${siteId}', planId: '${planId}' by userId: '${session.user.id}' (role: '${session.user.role}')`);

        const transaction = await PaymentClient.upgradePlan(
            session.user.id,
            (session.user as any).role,
            siteId,
            planId,
            couponCode,
            paymentMethod
        );

        return NextResponse.json(transaction);
    } catch (error: any) {
        console.error("[BILLING_UPGRADE]", error);
        if (error.message === "Forbidden") {
            return new NextResponse("Forbidden", { status: 403 });
        }
        if (error.message === "Plan not found") {
            return new NextResponse("Plan not found", { status: 404 });
        }
        if (error.message.includes("tertunda")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

