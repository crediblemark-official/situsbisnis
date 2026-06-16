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
        const { transactionId, paymentMethod } = body;

        if (!transactionId || !paymentMethod) {
            return NextResponse.json({ error: "transactionId and paymentMethod are required" }, { status: 400 });
        }

        const transaction = await db.paymentTransaction.findUnique({
            where: { id: transactionId },
            include: {
                plan: { select: { name: true } }
            }
        });

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Security: Only site owner or admin can initialize payment
        const isAdmin = (session.user as any).role === "admin";
        
        const { TenantClient } = await import("@/lib/modules/tenant/client");
        const { IdentityClient } = await import("@/lib/modules/identity/client");
        
        const site = await TenantClient.getSiteInfo(transaction.siteId);
        const ownerInfo = await IdentityClient.getSiteOwner(transaction.siteId);
        const isOwner = ownerInfo?.id === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch platform settings
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        if (!platformSettings?.duitkuMerchantCode || !platformSettings?.duitkuApiKey) {
            return NextResponse.json({ error: "Platform payment settings not configured" }, { status: 500 });
        }

        const { paymentManager, getPaymentMethodCategory } = await import("@crediblemark/buayar");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://situsbisnis.com";

        // Create a unique Duitku order ID using the paymentMethod and a short timestamp suffix
        const suffix = Date.now().toString().slice(-4);
        const uniqueDuitkuId = `${transaction.id}-${paymentMethod}-${suffix}`;

        const invoice = await paymentManager.createInvoice("duitku", {
            orderId: uniqueDuitkuId,
            amount: Number(transaction.amount),
            productDetails: transaction.plan ? `Upgrade Paket ${transaction.plan.name}` : "Upgrade Layanan SitusBisnis",
            customer: {
                name: site?.name || "Tenant",
                email: "tenant@situsbisnis.com", // Fallback email since billing is tenant-wide
            },
            paymentMethod,
            returnUrl: `${appUrl}/dashboard/billing?status=success`,
            callbackUrl: `${appUrl}/api/billing/webhook/duitku`
        }, {
            merchantCode: platformSettings.duitkuMerchantCode,
            apiKey: platformSettings.duitkuApiKey,
            sandbox: platformSettings.duitkuSandbox
        });

        if (!invoice.success) {
            return NextResponse.json({ error: invoice.error || "Failed to create Duitku invoice" }, { status: 500 });
        }

        const customPayload = {
            vaNumber: invoice.vaNumber || null,
            qrString: invoice.qrString || null,
            qrCodeUrl: invoice.qrCodeUrl || null,
            paymentCode: invoice.paymentCode || null,
            paymentMethod,
            category: getPaymentMethodCategory(paymentMethod),
            reference: invoice.reference,
            merchantOrderId: uniqueDuitkuId
        };

        const updatedTransaction = await db.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
                paymentUrl: `custom:${JSON.stringify(customPayload)}`,
                paymentReference: invoice.reference,
                paymentMethod: "duitku"
            }
        });

        return NextResponse.json({
            success: true,
            transaction: {
                id: updatedTransaction.id,
                paymentUrl: updatedTransaction.paymentUrl,
                paymentReference: updatedTransaction.paymentReference
            },
            paymentDetails: customPayload
        });
    } catch (error: any) {
        console.error("[BILLING_PAYMENT_INIT_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
