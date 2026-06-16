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
        const { transactionId, notes, proofOfPayment } = body;

        if (!transactionId) {
            return new NextResponse("Missing transaction ID", { status: 400 });
        }

        // Fetch transaction and verify if the logged-in user belongs to the site
        const existingTransaction = await db.paymentTransaction.findUnique({
            where: { id: transactionId }
        });

        if (!existingTransaction) {
            return new NextResponse("Transaction not found", { status: 404 });
        }

        const { IdentityClient } = await import("@/lib/modules/identity/client");
        const ownerInfo = await IdentityClient.getSiteOwner(existingTransaction.siteId);
        const isUserMember = ownerInfo?.id === session.user.id;
        
        if (!isUserMember && session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const transaction = await db.paymentTransaction.update({
            where: { id: transactionId },
            data: {
                notes,
                proofOfPayment,
                // We don't set status to approved here, that's for the admin
            }
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error("[BILLING_CONFIRM]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
