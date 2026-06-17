"use server";

import { PageClient } from "@/modules/page";
import { getApiContext } from "@/lib/api/utils";
import { z } from "zod";

const menuItemSchema = z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().min(1, "URL is required"),
    order: z.number().int().default(0),
    target: z.string().optional().default("_self"),
});

const menuUpdateSchema = z.object({
    items: z.array(menuItemSchema),
});

export async function createPageAction(body: any) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const { path } = body;
        if (!path) return { success: false, error: "Missing path" };

        try {
            await PageClient.savePage(siteId, body);
            return { success: true };
        } catch (err: any) {
            const message = err.message;
            if (message === "Unauthorized") {
                return { success: false, error: "Unauthorized" };
            }
            if (message === "Path already exists") {
                return { success: false, error: "Path already exists for this site" };
            }
            throw err;
        }
    } catch (error) {
        console.error("[CREATE_PAGE_ACTION] Error:", error);
        return { success: false, error: "Failed to save" };
    }
}

export async function deletePageAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!id) return { success: false, error: "ID required" };

        try {
            await PageClient.deletePage(id, siteId);
            return { success: true };
        } catch (err: any) {
            if (err.message === "Page not found") {
                return { success: false, error: "Page not found or unauthorized" };
            }
            throw err;
        }
    } catch (error) {
        console.error("[DELETE_PAGE_ACTION] Error:", error);
        return { success: false, error: "Failed to delete" };
    }
}

export async function updateMenuAction(slug: string, items: any[]) {
    try {
        const { siteId, error } = await getApiContext(["admin", "editor", "owner"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!slug) return { success: false, error: "Slug required" };

        const validation = menuUpdateSchema.safeParse({ items });
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const updated = await PageClient.updateMenu(slug, validation.data.items, siteId);
        return { success: true, menu: updated };
    } catch (error) {
        console.error("[UPDATE_MENU_ACTION] Error:", error);
        return { success: false, error: "Failed to update menu" };
    }
}
