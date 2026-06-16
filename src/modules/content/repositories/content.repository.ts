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
