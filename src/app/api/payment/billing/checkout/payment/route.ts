import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
        const { transactionId, paymentMethod } = body;

        if (!transactionId || !paymentMethod) {
            return NextResponse.json({ error: "transactionId and paymentMethod are required" }, { status: 400 });
        }

        const result = await PaymentClient.initializeCheckoutPayment(
            session.user.id,
            (session.user as any).role,
            transactionId,
            paymentMethod
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[BILLING_PAYMENT_INIT_ERROR]", error);
        if (error.message === "Forbidden") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (error.message === "Transaction not found") {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        const isDev = process.env.NODE_ENV === "development";
        return NextResponse.json({ error: isDev ? error.message : "Internal Server Error" }, { status: 500 });
    }
}

