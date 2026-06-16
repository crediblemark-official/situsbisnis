import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

        // Fetch transaction from DB
        const transaction = await db.paymentTransaction.findUnique({
            where: { id: transactionId },
            include: {
                plan: { select: { name: true } }
            }
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Security: Only the site owner or admin can check status
        const isAdmin = (session.user as any).role === "admin";
        let isOwner = false;
        
        if (!isAdmin) {
            const { IdentityClient } = await import("@/lib/modules/identity/client");
            const ownerInfo = await IdentityClient.getSiteOwner(transaction.siteId);
            isOwner = ownerInfo?.id === session.user.id;
        }

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // If already approved/failed, return DB status immediately (no API call needed)
        if (transaction.status === "approved" || transaction.status === "rejected") {
            return NextResponse.json({
                transactionId: transaction.id,
                status: transaction.status,
                amount: Number(transaction.amount),
                planName: (transaction.plan as any)?.name || "",
            });
        }

        // If no Duitku reference, it's a manual payment — just return current status
        if (!transaction.paymentReference) {
            return NextResponse.json({
                transactionId: transaction.id,
                status: transaction.status,
                amount: Number(transaction.amount),
                planName: (transaction.plan as any)?.name || "",
            });
        }

        // Check status from Duitku
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
            // Return DB status as fallback
            return NextResponse.json({
                transactionId: transaction.id,
                status: transaction.status,
                amount: Number(transaction.amount),
                planName: (transaction.plan as any)?.name || "",
            });
        }

        // Handle custom checkout suffixed transaction IDs (e.g. transactionId-method-suffix) stored in custom payload
        let merchantOrderIdForDuitku = transaction.id;
        if (transaction.paymentUrl && transaction.paymentUrl.startsWith("custom:")) {
            try {
                const customData = JSON.parse(transaction.paymentUrl.substring(7));
                if (customData.merchantOrderId) {
                    merchantOrderIdForDuitku = customData.merchantOrderId;
                }
            } catch {}
        }

        const { paymentManager } = await import("@crediblemark/buayar");
        const result = await paymentManager.checkTransaction("duitku", {
            merchantOrderId: merchantOrderIdForDuitku,
        }, {
            merchantCode: platformSettings.duitkuMerchantCode,
            apiKey: platformSettings.duitkuApiKey,
            sandbox: platformSettings.duitkuSandbox,
        });

        // If Duitku says paid and our DB still shows pending, process it
        if (result.success && result.status === "paid" && transaction.status === "pending") {
            try {
                const { BillingClient } = await import("@/lib/modules/billing/client");
                await BillingClient.processApprovedTransaction(transaction.id);
                console.log(`[CHECK_STATUS] Transaction '${transaction.id}' auto-approved via status polling.`);
            } catch (err: any) {
                if (err.message !== "ALREADY_PROCESSED") {
                    console.error(`[CHECK_STATUS] Error processing:`, err);
                }
            }
        }

        return NextResponse.json({
            transactionId: transaction.id,
            status: result.success ? result.status : transaction.status,
            statusCode: result.statusCode || "",
            amount: Number(transaction.amount),
            planName: (transaction.plan as any)?.name || "",
        });
    } catch (error) {
        console.error("[CHECK_STATUS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
