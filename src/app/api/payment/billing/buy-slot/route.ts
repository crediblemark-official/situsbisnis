import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PaymentClient } from "@/modules/payment";
import { validateCsrf } from "@/modules/shared/utils/csrf";

export async function POST(req: Request) {
    try {
        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return new NextResponse("CSRF validation failed", { status: 403 });
        }

        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { siteId, quantity, paymentMethod = "manual" } = body;

        const transaction = await PaymentClient.buySlot(
            session.user.id,
            siteId,
            quantity,
            paymentMethod
        );

        return NextResponse.json(transaction);
    } catch (error: any) {
        console.error("[BILLING_BUY_SLOT]", error);
        if (error.message === "Forbidden") {
            return new NextResponse("Forbidden", { status: 403 });
        }
        if (error.message === "Not Found" || error.message === "Active subscription not found") {
            return new NextResponse(error.message, { status: 404 });
        }
        if (
            error.message === "Missing data" || 
            error.message === "Add-on slots not available for this plan" || 
            error.message.includes("tertunda")
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

