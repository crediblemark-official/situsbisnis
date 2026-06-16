import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { OrderClient } from "@/modules/order";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Order ID required", 400);

        const order = await OrderClient.getOrderDetail(id, siteId);

        return apiResponse(order);
    } catch (error: any) {
        console.error("Error fetching order:", error);
        if (error.message === "Order not found") return apiError("Order not found", 404);
        return apiError("Internal Error");
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        const body = await req.json();

        const result = await OrderClient.updateOrderFulfillment(id, siteId, body);

        return apiResponse(result);
    } catch (error: any) {
        console.error("Error updating order:", error);
        if (error.message === "Order not found") return apiError("Order not found", 404);
        return apiError("Internal Error");
    }
}

