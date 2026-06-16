import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah artikel/post di suatu situs.
 */
export async function countPosts(siteId: string): Promise<number> {
    return db.post.count({
        where: { siteId }
    });
}

/**
 * Menghitung jumlah testimoni di suatu situs.
 */
export async function countTestimonials(siteId: string): Promise<number> {
    return db.testimonial.count({
        where: { siteId }
    });
}

/**
 * Menghitung jumlah item galeri di suatu situs.
 */
export async function countGalleryItems(siteId: string): Promise<number> {
    return db.galleryItem.count({
        where: { siteId }
    });
}

/**
 * Menghitung jumlah item portofolio di suatu situs.
 */
export async function countPortfolioItems(siteId: string): Promise<number> {
    return db.portfolioItem.count({
        where: { siteId }
    });
}

/**
 * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
 */
export async function sumMediaSize(siteId: string): Promise<number> {
    const result = await db.mediaItem.aggregate({
        where: { siteId },
        _sum: {
            size: true
        }
    });
    return result._sum.size || 0;
}

/**
 * Mencari artikel/post berdasarkan query teks (judul atau slug).
 */
export async function searchPosts(siteId: string, q: string, limit = 5) {
    return db.post.findMany({
        where: {
            siteId,
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
            ]
        },
        take: limit,
        select: { id: true, title: true }
    });
}

/**
 * Mencari halaman (pages) berdasarkan query teks (judul atau path).
 */
export async function searchPages(siteId: string, q: string, limit = 5) {
    return db.credBuildPage.findMany({
        where: {
            siteId,
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { path: { contains: q, mode: 'insensitive' } },
            ]
        },
        take: limit,
        select: { id: true, title: true, path: true }
    });
}
