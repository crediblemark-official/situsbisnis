import { db } from "@/lib/core/db";

export const ContentClient = {
    /**
     * Menghitung jumlah artikel/post di suatu situs.
     */
    async countPosts(siteId: string): Promise<number> {
        return db.post.count({
            where: { siteId }
        });
    },

    /**
     * Menghitung jumlah testimoni di suatu situs.
     */
    async countTestimonials(siteId: string): Promise<number> {
        return db.testimonial.count({
            where: { siteId }
        });
    },

    /**
     * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
     */
    async getMediaSize(siteId: string): Promise<number> {
        const result = await db.mediaItem.aggregate({
            where: { siteId },
            _sum: {
                size: true
            }
        });
        return result._sum.size || 0;
    }
};
