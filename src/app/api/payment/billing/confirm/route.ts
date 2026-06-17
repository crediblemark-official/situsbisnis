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
        const { transactionId, notes, proofOfPayment } = body;

        if (!transactionId) {
            return new NextResponse("Missing transaction ID", { status: 400 });
        }

        const transaction = await PaymentClient.confirmManualPayment(
            session.user.id,
            (session.user as any).role,
            transactionId,
            notes,
            proofOfPayment
        );

        return NextResponse.json(transaction);
    } catch (error: any) {
        console.error("[BILLING_CONFIRM]", error);
        if (error.message === "Forbidden") {
            return new NextResponse("Forbidden", { status: 403 });
        }
        if (error.message === "Transaction not found") {
            return new NextResponse("Transaction not found", { status: 404 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

