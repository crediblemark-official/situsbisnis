"use server";

import { getApiContext } from "@/lib/api/utils";
import { OrderClient } from "../index";

export async function updateOrderFulfillmentAction(id: string, body: any) {
    try {
        const { siteId, error } = await getApiContext(["admin", "editor", "owner"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const result = await OrderClient.updateOrderFulfillment(id, siteId, body);
        return { success: true, result };
    } catch (err: any) {
        console.error("[UPDATE_ORDER_FULFILLMENT_ACTION] Error:", err);
        return { success: false, error: err.message || "Terjadi kesalahan saat memperbarui status" };
    }
}
