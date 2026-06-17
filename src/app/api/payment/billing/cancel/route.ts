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
        const { transactionId } = body;

        if (!transactionId) {
            return new NextResponse("Missing transactionId", { status: 400 });
        }

        const result = await PaymentClient.cancelTransaction(
            session.user.id,
            transactionId
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[BILLING_CANCEL_TX]", error);
        if (error.message === "Forbidden") {
            return new NextResponse("Forbidden", { status: 403 });
        }
        if (error.message === "Transaction not found") {
            return new NextResponse("Transaction not found", { status: 404 });
        }
        if (error.message.includes("Hanya transaksi")) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

