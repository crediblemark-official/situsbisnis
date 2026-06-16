import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
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

        // If already paid, return immediately
        if (order.paymentStatus === "paid" || order.paymentStatus === "approved") {
            return NextResponse.json({
                orderId: order.id,
                status: order.paymentStatus,
                amount: Number(order.total),
                customerName: order.customerName,
                siteName: order.site?.name || "",
            });
        }

        // If no Duitku reference, return current status
        if (!order.paymentReference) {
            return NextResponse.json({
                orderId: order.id,
                status: order.paymentStatus || "pending",
                amount: Number(order.total),
                customerName: order.customerName,
                siteName: order.site?.name || "",
            });
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
            }
        }

        if (!merchantCode || !apiKey) {
            return NextResponse.json({
                orderId: order.id,
                status: order.paymentStatus || "pending",
                amount: Number(order.total),
                customerName: order.customerName,
                siteName: order.site?.name || "",
            });
        }

        // Handle custom checkout suffixed order IDs (e.g. orderId-method-suffix) stored in custom payload
        let merchantOrderIdForDuitku = order.id;
        if (order.paymentUrl && order.paymentUrl.startsWith("custom:")) {
            try {
                const customData = JSON.parse(order.paymentUrl.substring(7));
                if (customData.merchantOrderId) {
                    merchantOrderIdForDuitku = customData.merchantOrderId;
                }
            } catch {}
        }

        const { paymentManager } = await import("@crediblemark/buayar");
        const result = await paymentManager.checkTransaction("duitku", {
            merchantOrderId: merchantOrderIdForDuitku,
        }, {
            merchantCode,
            apiKey,
            sandbox,
        });

        // Auto-update order status if Duitku says paid
        if (result.success && result.status === "paid" && order.paymentStatus !== "paid") {
            await db.order.update({
                where: { id: order.id },
                data: { 
                    paymentStatus: "paid",
                    status: "processing"
                }
            });
            console.log(`[ORDER_CHECK_STATUS] Order '${order.id}' marked as paid via polling.`);
        }

        return NextResponse.json({
            orderId: order.id,
            status: result.success ? (result.status === "paid" ? "paid" : order.paymentStatus || "pending") : (order.paymentStatus || "pending"),
            amount: Number(order.total),
            customerName: order.customerName,
            siteName: order.site?.name || "",
        });
    } catch (error) {
        console.error("[ORDER_CHECK_STATUS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
