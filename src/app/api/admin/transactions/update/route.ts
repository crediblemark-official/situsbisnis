import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { BillingClient } from "@/modules/billing";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { transactionId, status } = body;

        if (!transactionId || !status) {
            return new NextResponse("Missing data", { status: 400 });
        }

        let result;
        if (status === "approved") {
            result = await BillingClient.processApprovedTransaction(transactionId);
        } else {
            result = await BillingClient.updateTransactionStatus(transactionId, status);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ADMIN_TRANSACTION_UPDATE]", error);
        if (error.message === "TRANSACTION_NOT_FOUND") {
            return new NextResponse("Transaction not found", { status: 404 });
        }
        if (error.message === "ALREADY_PROCESSED") {
            return new NextResponse("Transaction has already been processed", { status: 400 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
