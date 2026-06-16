import { db } from "@/lib/core/db";
import { apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { BillingClient } from "@/lib/modules/billing/client";
import { z as _z } from "zod";
import zod from "zod";
const z: typeof _z = _z || (zod as any).z || zod;

const orderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number()
    })),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    paymentMethod: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const siteId = await (async () => {
            // Special case for orders: they might come from a public site (no session)
            // But we still need site context
            const { getSiteId } = await import("@/lib/domains/tenant");
            return await getSiteId();
        })();

        if (!siteId) return apiError("Site context required", 400);

        // Check subscription limit for orders
        const limitCheck = await BillingClient.checkSiteLimit(siteId, "maxOrders");
        if (!limitCheck.allowed) {
            return apiError(limitCheck.message, 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, orderSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { items, name, email, address, city, zip, phone, paymentMethod } = data;

        // Try to get session if available (for logged in customers)
        const { getServerSession } = await import("next-auth");
        const { authOptions } = await import("@/lib/auth");
        const session = await getServerSession(authOptions);

        const customerEmail = session?.user?.email || email;
        const customerName = session?.user?.name || name || "Guest Customer";
        const customerAddress = address 
            ? `${address}${city ? `, ${city}` : ""}${zip ? ` ${zip}` : ""}${phone ? ` (WA/Telp: ${phone})` : ""}` 
            : `No Address Provided${phone ? ` (WA/Telp: ${phone})` : ""}`;

        if (!customerEmail) return apiError("Email is required", 400);

        // Fetch products from database using their IDs and ensuring they belong to this siteId
        const productIds = items.map((item: any) => item.productId);
        const dbProducts = await db.product.findMany({
            where: {
                id: { in: productIds },
                siteId
            }
        });

        const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

        // Calculate total safely and construct final items using DB prices
        let total = 0;
        const orderItemsData = [];

        for (const item of items) {
            const dbProduct = productMap.get(item.productId);
            if (!dbProduct) {
                return apiError(`Product not found or invalid: ${item.productId}`, 400);
            }
            
            const dbPrice = Number(dbProduct.price);
            total += dbPrice * item.quantity;
            
            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: dbPrice.toFixed(2)
            });
        }

        const newOrder = await db.order.create({
            data: {
                customerName,
                customerEmail,
                customerAddress,
                total: total.toFixed(2),
                status: "pending",
                paymentStatus: "pending",
                fulfillmentStatus: "unfulfilled",
                paymentMethod: paymentMethod || "system",
                siteId,
                items: {
                    create: orderItemsData
                }
            },
            include: {
                items: true
            }
        });

        // Fetch site details for product description
        const site = await db.site.findUnique({
            where: { id: siteId },
            select: { name: true }
        });

        // Check if Duitku settings are configured for this site
        const paymentSettings = await db.paymentSettings.findUnique({
            where: { siteId }
        });

        // Check if platform settings are configured (for platform-managed payment gateway fallback)
        const platformSettings = await db.platformSettings.findUnique({
            where: { id: "global" }
        });

        let merchantCode = paymentSettings?.duitkuMerchantCode;
        let apiKey = paymentSettings?.duitkuApiKey;
        let sandbox = paymentSettings?.duitkuSandbox ?? true;

        if (!merchantCode || !apiKey) {
            // Fallback to platform settings
            if (platformSettings?.duitkuMerchantCode && platformSettings?.duitkuApiKey) {
                merchantCode = platformSettings.duitkuMerchantCode;
                apiKey = platformSettings.duitkuApiKey;
                sandbox = platformSettings.duitkuSandbox;
            }
        }

        let orderToReturn = newOrder;
        if (paymentMethod === "manual" && paymentSettings) {
            const customDetails = {
                paymentMethod: "manual",
                bankName: paymentSettings.bankName || "",
                accountHolder: paymentSettings.accountHolder || "",
                vaNumber: paymentSettings.accountNumber || "",
                instructions: paymentSettings.instructions || ""
            };
            try {
                orderToReturn = await db.order.update({
                    where: { id: newOrder.id },
                    data: {
                        paymentUrl: `custom:${JSON.stringify(customDetails)}`
                    },
                    include: { items: true }
                });
            } catch (updateError) {
                console.error("[CreateOrder] Failed to save manual details:", updateError);
            }
        } else if (merchantCode && apiKey && paymentMethod !== "whatsapp") {
            try {
                const { paymentManager } = await import("@crediblemark/buayar");
                const host = req.headers.get("host") || "situsbisnis.com";
                const protocol = req.headers.get("x-forwarded-proto") || "https";
                const origin = `${protocol}://${host}`;
                
                const invoice = await paymentManager.createInvoice("duitku", {
                    orderId: newOrder.id,
                    amount: total,
                    productDetails: `Pembayaran Pesanan #${newOrder.id} • Toko: ${site?.name || "SitusBisnis"}`,
                    customer: {
                        name: customerName,
                        email: customerEmail,
                    },
                    returnUrl: `${origin}/checkout/success?orderId=${newOrder.id}`,
                    callbackUrl: `${origin}/api/orders/webhook/duitku`
                }, {
                    merchantCode,
                    apiKey,
                    sandbox
                });

                if (invoice.success && invoice.paymentUrl) {
                    orderToReturn = await db.order.update({
                        where: { id: newOrder.id },
                        data: {
                            paymentUrl: invoice.paymentUrl,
                            paymentReference: invoice.reference
                        },
                        include: { items: true }
                    });
                } else {
                    console.warn(`[DUITKU_ORDER] Invoice creation failed: ${invoice.error}`);
                }
            } catch (duitkuError) {
                console.error("[DUITKU_ORDER_ERROR]", duitkuError);
            }
        }

        return apiResponse(orderToReturn);
    } catch (error) {
        console.error("[CreateOrder]", error);
        return apiError("Internal Error");
    }
}
