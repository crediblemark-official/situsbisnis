import { db } from "@/modules/shared/core/db";

/**
 * Mengambil daftar media items berdasarkan siteId dan folderId.
 */
export async function findMediaItems(siteId: string, folderId: string | null, limit: number, skip: number) {
    return db.mediaItem.findMany({
        where: {
            siteId,
            folderId: folderId === "root" ? null : folderId
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
        select: {
            id: true,
            url: true,
            filename: true,
            mimeType: true,
            size: true,
            createdAt: true,
            folderId: true,
        }
    });
}

/**
 * Menghitung jumlah total media items di suatu situs.
 */
export async function countMediaItems(siteId: string): Promise<number> {
    return db.mediaItem.count({
        where: { siteId }
    });
}

/**
 * Membuat media item baru.
 */
export async function createMediaItem(data: {
    siteId: string;
    folderId?: string | null;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    width?: number | null;
    height?: number | null;
    blurDataURL?: string | null;
}) {
    return db.mediaItem.create({
        data: {
            siteId: data.siteId,
            folderId: data.folderId && data.folderId !== "root" ? data.folderId : null,
            url: data.url,
            filename: data.filename,
            mimeType: data.mimeType,
            size: data.size,
            width: data.width,
            height: data.height,
            blurDataURL: data.blurDataURL
        }
    });
}

/**
 * Mencari media item berdasarkan ID dan siteId.
 */
export async function findMediaItemByIdAndSite(id: string, siteId: string) {
    return db.mediaItem.findFirst({
        where: { id, siteId }
    });
}

/**
 * Menghapus media item.
 */
export async function deleteMediaItem(id: string) {
    return db.mediaItem.delete({
        where: { id }
    });
}

/**
 * Mengambil daftar folder media berdasarkan siteId dan parentId.
 */
export async function findMediaFolders(siteId: string, parentId: string | null) {
    return db.mediaFolder.findMany({
        where: {
            siteId,
            parentId: parentId
        },
        select: {
            id: true,
            name: true,
            parentId: true,
            _count: {
                select: { items: true, children: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

/**
 * Membuat folder media baru.
 */
export async function createMediaFolder(data: {
    name: string;
    siteId: string;
    parentId?: string | null;
}) {
    return db.mediaFolder.create({
        data: {
            name: data.name,
            siteId: data.siteId,
            parentId: data.parentId || null
        }
    });
}

/**
 * Mencari folder media berdasarkan ID dan siteId.
 */
export async function findMediaFolderByIdAndSite(id: string, siteId: string) {
    return db.mediaFolder.findFirst({
        where: { id, siteId }
    });
}

/**
 * Mencari folder media beserta jumlah isinya (items & children).
 */
export async function findMediaFolderWithCounts(id: string) {
    return db.mediaFolder.findUnique({
        where: { id },
        include: { _count: { select: { items: true, children: true } } }
    });
}

/**
 * Menghapus folder media.
 */
export async function deleteMediaFolder(id: string) {
    return db.mediaFolder.delete({
        where: { id }
    });
}
