import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, paymentMethod } = body;

        if (!orderId || !paymentMethod) {
            return NextResponse.json({ error: "orderId and paymentMethod are required" }, { status: 400 });
        }

        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                site: { select: { name: true } }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Fetch subsite's PaymentSettings to verify credentials
        const paymentSettings = await db.paymentSettings.findUnique({
            where: { siteId: order.siteId }
        });

        // Fetch platform settings for fallback
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        let merchantCode = paymentSettings?.duitkuMerchantCode;
        let apiKey = paymentSettings?.duitkuApiKey;
        let sandbox = paymentSettings?.duitkuSandbox ?? true;

        if (!merchantCode || !apiKey) {
            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                merchantCode = platformSettings.duitkuMerchantCode;
                apiKey = platformSettings.duitkuApiKey;
                sandbox = platformSettings.duitkuSandbox;
            } else {
                return NextResponse.json({ error: "Payment settings not configured" }, { status: 500 });
            }
        }

        const { paymentManager, getPaymentMethodCategory } = await import("@crediblemark/buayar");
        const host = req.headers.get("host") || "situsbisnis.com";
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const origin = `${protocol}://${host}`;

        // Create a unique Duitku order ID using the paymentMethod and a short timestamp suffix
        const suffix = Date.now().toString().slice(-4);
        const uniqueDuitkuId = `${order.id}-${paymentMethod}-${suffix}`;

        const invoice = await paymentManager.createInvoice("duitku", {
            orderId: uniqueDuitkuId,
            amount: Number(order.total),
            productDetails: `Pembayaran Pesanan #${order.id} • Toko: ${order.site?.name || "SitusBisnis"}`,
            customer: {
                name: order.customerName,
                email: order.customerEmail,
            },
            paymentMethod,
            returnUrl: `${origin}/checkout/success?orderId=${order.id}`,
            callbackUrl: `${origin}/api/orders/webhook/duitku`
        }, {
            merchantCode,
            apiKey,
            sandbox
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

        const updatedOrder = await db.order.update({
            where: { id: order.id },
            data: {
                paymentUrl: `custom:${JSON.stringify(customPayload)}`,
                paymentReference: invoice.reference
            }
        });

        return NextResponse.json({
            success: true,
            order: {
                id: updatedOrder.id,
                paymentUrl: updatedOrder.paymentUrl,
                paymentReference: updatedOrder.paymentReference
            },
            paymentDetails: customPayload
        });
    } catch (error: any) {
        console.error("[ORDER_PAYMENT_INIT_ERROR]", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
