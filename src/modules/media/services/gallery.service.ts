import { z } from "zod";
import * as contentRepo from "../repositories/content.repository";
import * as galleryRepo from "../repositories/gallery.repository";
import { buildPagination, fetchWithCache, publishCrudEvent } from "@/modules/shared/core/crud-base";
import { AppError } from "@/modules/shared/utils/api/errors";

export const galleryItemSchema = z.object({
    title: z.string().optional(),
    url: z.string().url("Invalid image URL"),
    description: z.string().optional(),
    id: z.string().optional(),
});

const listSelect = { id: true, title: true, url: true, description: true, createdAt: true };

export async function getGalleryItems(siteId: string) {
    return contentRepo.findGalleryItems(siteId);
}

export async function listGalleryItems(siteId: string, searchParams: URLSearchParams) {
    const pagination = buildPagination(searchParams);
    const cacheKey = `gallery-list-${siteId}-${pagination.page}-${pagination.limit}`;

    return fetchWithCache(
        cacheKey,
        async () => {
            const [data, total] = await Promise.all([
                galleryRepo.findGalleryItems(siteId, { skip: pagination.skip, take: pagination.limit }, listSelect),
                galleryRepo.countGalleryItems(siteId)
            ]);
            return {
                data,
                pagination: {
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    totalPages: Math.ceil(total / pagination.limit)
                }
            };
        },
        [`site-${siteId}`, `site-${siteId}-galleryItem`],
        300
    );
}

export async function createGalleryItem(siteId: string, data: any) {
    const parsed = galleryItemSchema.parse(data);
    const { id: _id, ...createData } = parsed;
    const item = await galleryRepo.createGalleryItem(createData, siteId);
    await publishCrudEvent("crud.created", "galleryItem", siteId, item);
    return item;
}

export async function getGalleryItemDetail(id: string, siteId: string) {
    const item = await galleryRepo.findGalleryItemById(id, siteId);
    if (!item) throw new AppError("Item not found", 404);
    return item;
}

export async function updateGalleryItem(id: string, siteId: string, data: any) {
    const existing = await galleryRepo.findGalleryItemById(id, siteId);
    if (!existing) throw new AppError("Item not found", 404);

    const parsed = galleryItemSchema.parse(data);
    const { id: _id, ...updateData } = parsed;
    const item = await galleryRepo.updateGalleryItem(id, siteId, updateData);
    await publishCrudEvent("crud.updated", "galleryItem", siteId, item);
    return item;
}

export async function deleteGalleryItem(id: string, siteId: string) {
    const existing = await galleryRepo.findGalleryItemById(id, siteId);
    if (!existing) throw new AppError("Item not found", 404);

    await galleryRepo.deleteGalleryItem(id, siteId);
    await publishCrudEvent("crud.deleted", "galleryItem", siteId, existing);
    return { success: true };
}
