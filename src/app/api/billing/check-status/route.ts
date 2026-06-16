import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BillingClient } from "@/lib/modules/billing/client";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { transactionId } = body;

        if (!transactionId) {
            return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
        }

        const result = await BillingClient.checkTransactionStatus(
            session.user.id,
            (session.user as any).role,
            transactionId
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[CHECK_STATUS]", error);
        if (error.message === "Forbidden") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (error.message === "Transaction not found") {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}

