import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Order ID required", 400);

        const order = await db.order.findFirst({
            where: { id, siteId },
            include: { items: true }
        });

        if (!order) return apiError("Order not found", 404);

        const { CatalogClient } = await import("@/lib/modules/catalog/client");
        const productIds = order.items.map(item => item.productId);
        const productsMap = await CatalogClient.getProductsMap(productIds);

        const decoratedItems = order.items.map(item => ({
            ...item,
            product: productsMap[item.productId] || null
        }));

        return apiResponse({
            ...order,
            items: decoratedItems
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return apiError("Internal Error");
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        const body = await req.json();
        const { paymentStatus, fulfillmentStatus, status: orderStatus } = body;

        const order = await db.order.findFirst({
            where: { id, siteId }
        });
        if (!order) return apiError("Order not found", 404);

        const updateData: any = {};
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus;
        if (orderStatus) updateData.status = orderStatus;

        const updated = await db.order.update({
            where: { id },
            data: updateData
        });

        return apiResponse({ success: true, order: updated });
    } catch (error) {
        console.error("Error updating order:", error);
        return apiError("Internal Error");
    }
}
