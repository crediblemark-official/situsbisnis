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

/**
 * Mencari artikel berdasarkan slug di suatu situs.
 */
export async function findPostBySlug(siteId: string, slug: string) {
    return db.post.findUnique({
        where: { siteId_slug: { siteId, slug } },
        include: {
            metaData: true
        }
    });
}

/**
 * Mengambil daftar artikel aktif (published) di suatu situs.
 */
export async function findPublishedPosts(siteId: string) {
    return db.post.findMany({
        where: { published: true, siteId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            slug: true,
            imageUrl: true,
            excerpt: true,
            createdAt: true,
        }
    });
}

/**
 * Mengambil daftar media galeri di suatu situs.
 */
export async function findGalleryItems(siteId: string) {
    return db.galleryItem.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            url: true,
            title: true,
            description: true,
            createdAt: true
        }
    });
}

/**
 * Mengambil daftar item portofolio di suatu situs.
 */
export async function findPortfolioItems(siteId: string) {
    return db.portfolioItem.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true,
            link: true,
            description: true,
            createdAt: true
        }
    });
}

/**
 * Mengambil daftar testimoni yang disetujui (approved) di suatu situs.
 */
export async function findTestimonialById(siteId: string, id: string) {
    return db.testimonial.findFirst({
        where: { id, siteId }
    });
}

export async function findApprovedTestimonials(siteId: string) {
    return db.testimonial.findMany({
        where: { isApproved: true, siteId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            quote: true,
            author: true,
            role: true,
            avatarUrl: true,
            rating: true,
            createdAt: true
        }
    });
}
