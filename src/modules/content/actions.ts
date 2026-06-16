import * as contentService from "./services/content.service";

/**
 * Menghitung jumlah artikel/post di suatu situs.
 */
export async function countPostsInternal(siteId: string): Promise<number> {
    return contentService.countPosts(siteId);
}

/**
 * Menghitung jumlah testimoni di suatu situs.
 */
export async function countTestimonialsInternal(siteId: string): Promise<number> {
    return contentService.countTestimonials(siteId);
}

/**
 * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
 */
export async function getMediaSizeInternal(siteId: string): Promise<number> {
    return contentService.getMediaSize(siteId);
}
