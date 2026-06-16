import { NextResponse } from "next/server";
import { PaymentClient } from "@/modules/payment";

export async function POST(req: Request) {
    // 1. Strict Guard: Only allow this simulation endpoint in development mode
    if (process.env.NODE_ENV !== "development") {
        return new NextResponse("Forbidden in production", { status: 403 });
    }

    try {
        const body = await req.json();
        const { transactionId } = body;

        if (!transactionId) {
            return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
        }

        console.log(`[DEV_SIMULATION] Simulating approved Duitku payment for transaction '${transactionId}'...`);
        
        await PaymentClient.processApprovedTransaction(transactionId);
        
        console.log(`[DEV_SIMULATION] Transaction '${transactionId}' successfully approved and subscription activated!`);
        
        return NextResponse.json({ success: true, message: "Transaction approved successfully" });
    } catch (error: any) {
        console.error("[DEV_SIMULATION_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
