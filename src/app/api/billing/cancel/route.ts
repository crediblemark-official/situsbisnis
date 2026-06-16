import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { transactionId } = body;

        if (!transactionId) {
            return new NextResponse("Missing transactionId", { status: 400 });
        }

        // Find the transaction and check ownership through the site's users relationship
        const tx = await db.paymentTransaction.findUnique({
            where: { id: transactionId }
        });

        if (!tx) {
            return new NextResponse("Transaction not found", { status: 404 });
        }

        // Verify that the user owns the site associated with the transaction
        const { IdentityClient } = await import("@/lib/modules/identity/client");
        const ownerInfo = await IdentityClient.getSiteOwner(tx.siteId);
        const isOwner = ownerInfo?.id === session.user.id;
        
        if (!isOwner) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Only allow deleting pending transactions
        if (tx.status !== "pending") {
            return NextResponse.json(
                { error: "Hanya transaksi tertunda yang dapat dibatalkan." },
                { status: 400 }
            );
        }

        // Delete the transaction permanently
        await db.paymentTransaction.delete({
            where: { id: transactionId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[BILLING_CANCEL_TX]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
