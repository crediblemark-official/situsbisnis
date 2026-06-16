import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BillingClient } from "@/modules/billing";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { withdrawalId, status } = body;

        if (!withdrawalId || !status) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const result = await BillingClient.processWithdrawalStatus(withdrawalId, status);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ADMIN_WITHDRAWAL_UPDATE]", error);
        if (error.message === "NOT_FOUND") return new NextResponse("Not found", { status: 404 });
        if (error.message === "ALREADY_PROCESSED") return new NextResponse("Already processed", { status: 400 });
        return new NextResponse("Internal Error", { status: 500 });
    }
}

