"use server";

import { getApiContext } from "@/lib/api/utils";
import { db } from "@/modules/shared/core/db";
import { eventBus } from "@/modules/shared/core/event-bus";
import { galleryItemSchema } from "../api/gallery";
import { portfolioItemSchema } from "../api/portfolio";

export async function createGalleryItemAction(body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = galleryItemSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const created = await db.galleryItem.create({
            data: {
                ...validation.data,
                siteId
            }
        });

        await eventBus.publish("crud.created", {
            model: "galleryItem",
            siteId,
            item: created
        }, "crud").catch(console.error);

        return { success: true, item: created };
    } catch (err: any) {
        console.error("[CREATE_GALLERY_ITEM_ACTION] Error:", err);
        return { success: false, error: "Failed to create gallery item" };
    }
}

export async function updateGalleryItemAction(id: string, body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = galleryItemSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const existing = await db.galleryItem.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Item not found or unauthorized" };

        const updated = await db.galleryItem.update({
            where: { id },
            data: validation.data
        });

        await eventBus.publish("crud.updated", {
            model: "galleryItem",
            siteId,
            item: updated
        }, "crud").catch(console.error);

        return { success: true, item: updated };
    } catch (err: any) {
        console.error("[UPDATE_GALLERY_ITEM_ACTION] Error:", err);
        return { success: false, error: "Failed to update gallery item" };
    }
}

export async function deleteGalleryItemAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const existing = await db.galleryItem.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Item not found or unauthorized" };

        const deleted = await db.galleryItem.delete({ where: { id } });

        await eventBus.publish("crud.deleted", {
            model: "galleryItem",
            siteId,
            item: deleted
        }, "crud").catch(console.error);

        return { success: true, item: deleted };
    } catch (err: any) {
        console.error("[DELETE_GALLERY_ITEM_ACTION] Error:", err);
        return { success: false, error: "Failed to delete gallery item" };
    }
}

export async function createPortfolioItemAction(body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = portfolioItemSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const created = await db.portfolioItem.create({
            data: {
                ...validation.data,
                siteId
            }
        });

        await eventBus.publish("crud.created", {
            model: "portfolioItem",
            siteId,
            item: created
        }, "crud").catch(console.error);

        return { success: true, item: created };
    } catch (err: any) {
        console.error("[CREATE_PORTFOLIO_ITEM_ACTION] Error:", err);
        return { success: false, error: "Failed to create portfolio item" };
    }
}

export async function updatePortfolioItemAction(id: string, body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = portfolioItemSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const existing = await db.portfolioItem.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Item not found or unauthorized" };

        const updated = await db.portfolioItem.update({
            where: { id },
            data: validation.data
        });

        await eventBus.publish("crud.updated", {
            model: "portfolioItem",
            siteId,
            item: updated
        }, "crud").catch(console.error);

        return { success: true, item: updated };
    } catch (err: any) {
        console.error("[UPDATE_PORTFOLIO_ITEM_ACTION] Error:", err);
        return { success: false, error: "Failed to update portfolio item" };
    }
}

export async function deletePortfolioItemAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const existing = await db.portfolioItem.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Item not found or unauthorized" };

        const deleted = await db.portfolioItem.delete({ where: { id } });

        await eventBus.publish("crud.deleted", {
            model: "portfolioItem",
            siteId,
            item: deleted
        }, "crud").catch(console.error);

        return { success: true, item: deleted };
    } catch (err: any) {
        console.error("[DELETE_PORTFOLIO_ITEM_ACTION] Error:", err);
        return { success: false, error: "Failed to delete portfolio item" };
    }
}

import { MediaClient } from "@/modules/media";

export async function createMediaFolderAction(name: string, parentId: string | null) {
    try {
        const { siteId, error } = await getApiContext(["admin", "editor", "owner"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        try {
            const folder = await MediaClient.createMediaFolder(siteId, name, parentId);
            return { success: true, folder };
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "NAME_REQUIRED") return { success: false, error: "Nama folder wajib diisi" };
            throw serviceError;
        }
    } catch (err: any) {
        console.error("[CREATE_MEDIA_FOLDER_ACTION] Error:", err);
        return { success: false, error: "Gagal membuat folder" };
    }
}

export async function deleteMediaFolderAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "editor", "owner"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        try {
            const result = await MediaClient.deleteMediaFolder(siteId, id);
            return { success: true, result };
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "ID_REQUIRED") return { success: false, error: "ID folder wajib diisi" };
            if (msg === "NOT_FOUND") return { success: false, error: "Folder tidak ditemukan" };
            if (msg === "FOLDER_NOT_EMPTY") return { success: false, error: "Folder tidak kosong, tidak dapat dihapus" };
            throw serviceError;
        }
    } catch (err: any) {
        console.error("[DELETE_MEDIA_FOLDER_ACTION] Error:", err);
        return { success: false, error: "Gagal menghapus folder" };
    }
}

export async function deleteMediaAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "editor", "owner"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        try {
            const result = await MediaClient.deleteMedia(siteId, id);
            return { success: true, result };
        } catch (serviceError: any) {
            const msg = serviceError?.message || "";
            if (msg === "ID_REQUIRED") return { success: false, error: "ID media wajib diisi" };
            if (msg === "NOT_FOUND") return { success: false, error: "File media tidak ditemukan" };
            throw serviceError;
        }
    } catch (err: any) {
        console.error("[DELETE_MEDIA_ACTION] Error:", err);
        return { success: false, error: "Gagal menghapus file media" };
    }
}

export async function getMediaListAction(folderId: string | null, page: number = 1, limit: number = 50) {
    try {
        const { siteId, error } = await getApiContext();
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const result = await MediaClient.getMediaList(siteId, folderId, page, limit);
        return { success: true, ...result };
    } catch (err: any) {
        console.error("[GET_MEDIA_LIST_ACTION] Error:", err);
        return { success: false, error: "Gagal mengambil daftar media" };
    }
}

export async function getMediaFoldersAction(parentId: string | null) {
    try {
        const { siteId, error } = await getApiContext();
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const folders = await MediaClient.getMediaFolders(siteId, parentId);
        return { success: true, folders };
    } catch (err: any) {
        console.error("[GET_MEDIA_FOLDERS_ACTION] Error:", err);
        return { success: false, error: "Gagal mengambil folder media" };
    }
}

