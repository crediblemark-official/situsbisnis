import { db } from "@/modules/shared/core/db";

export async function countGalleryItems(siteId: string): Promise<number> {
    return db.galleryItem.count({ where: { siteId } });
}

export async function findGalleryItems(
    siteId: string,
    pagination: { skip: number; take: number },
    listSelect?: any
) {
    return db.galleryItem.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        ...(listSelect ? { select: listSelect } : {})
    });
}

export async function findGalleryItemById(id: string, siteId: string) {
    return db.galleryItem.findFirst({
        where: { id, siteId }
    });
}

export async function createGalleryItem(data: any, siteId: string) {
    return db.galleryItem.create({
        data: {
            ...data,
            siteId: siteId
        }
    });
}

export async function updateGalleryItem(id: string, siteId: string, data: any) {
    const existing = await db.galleryItem.findFirst({ where: { id, siteId } });
    if (!existing) return null;
    return db.galleryItem.update({
        where: { id },
        data
    });
}

export async function deleteGalleryItem(id: string, siteId: string) {
    const existing = await db.galleryItem.findFirst({ where: { id, siteId } });
    if (!existing) return null;
    return db.galleryItem.delete({ where: { id } });
}
