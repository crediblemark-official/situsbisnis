"use server";

import { getApiContext } from "@/lib/api/utils";
import { db } from "@/modules/shared/core/db";
import { eventBus } from "@/modules/shared/core/event-bus";
import { productSchema } from "../api/product";

export async function createProductAction(body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = productSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        // Limit Check
        const limitCheck = await eventBus.request<{ siteId: string; limitType: string }, { allowed: boolean; message: string }>(
            "request.billing.checkLimit",
            { siteId, limitType: "maxProducts" }
        );
        if (!limitCheck.allowed) return { success: false, error: limitCheck.message };

        const { metaData, ...rest } = validation.data;

        const created = await db.product.create({
            data: {
                ...rest,
                siteId,
                updatedAt: new Date()
            }
        });

        if (created && metaData && Array.isArray(metaData)) {
            await db.metaData.createMany({
                data: metaData.map((m: any) => ({
                    key: m.key,
                    value: m.value,
                    type: m.type || "text",
                    productId: created.id
                }))
            });
        }

        await eventBus.publish("crud.created", {
            model: "product",
            siteId,
            item: created
        }, "crud").catch(console.error);

        return { success: true, item: created };
    } catch (err: any) {
        console.error("[CREATE_PRODUCT_ACTION] Error:", err);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProductAction(id: string, body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        if (!id) return { success: false, error: "ID required" };

        const validation = productSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const existing = await db.product.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Product not found or unauthorized" };

        const { metaData, ...rest } = validation.data;

        const updated = await db.product.update({
            where: { id },
            data: {
                ...rest,
                updatedAt: new Date()
            }
        });

        if (metaData && Array.isArray(metaData)) {
            await db.metaData.deleteMany({ where: { productId: id } });
            await db.metaData.createMany({
                data: metaData.map((m: any) => ({
                    key: m.key,
                    value: m.value,
                    type: m.type || "text",
                    productId: id
                }))
            });
        }

        await eventBus.publish("crud.updated", {
            model: "product",
            siteId,
            item: updated
        }, "crud").catch(console.error);

        return { success: true, item: updated };
    } catch (err: any) {
        console.error("[UPDATE_PRODUCT_ACTION] Error:", err);
        return { success: false, error: "Failed to update product" };
    }
}

export async function deleteProductAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!id) return { success: false, error: "ID required" };

        const existing = await db.product.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Product not found or unauthorized" };

        await db.metaData.deleteMany({ where: { productId: id } });
        const deleted = await db.product.delete({ where: { id } });

        await eventBus.publish("crud.deleted", {
            model: "product",
            siteId,
            item: deleted
        }, "crud").catch(console.error);

        return { success: true, item: deleted };
    } catch (err: any) {
        console.error("[DELETE_PRODUCT_ACTION] Error:", err);
        return { success: false, error: "Failed to delete product" };
    }
}

export async function archiveProductAction(id: string, isArchived: boolean) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!id) return { success: false, error: "ID required" };

        const existing = await db.product.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Product not found or unauthorized" };

        const updated = await db.product.update({
            where: { id },
            data: { isArchived }
        });

        await eventBus.publish("crud.updated", {
            model: "product",
            siteId,
            item: updated
        }, "crud").catch(console.error);

        return { success: true, item: updated };
    } catch (err: any) {
        console.error("[ARCHIVE_PRODUCT_ACTION] Error:", err);
        return { success: false, error: "Gagal mengubah status arsip produk" };
    }
}
