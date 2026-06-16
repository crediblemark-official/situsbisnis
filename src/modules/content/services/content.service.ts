import * as contentRepo from "../repositories/content.repository";
import * as mediaRepo from "../repositories/media.repository";

/**
 * Menghitung jumlah artikel/post di suatu situs.
 */
export async function countPosts(siteId: string): Promise<number> {
    return contentRepo.countPosts(siteId);
}

/**
 * Menghitung jumlah testimoni di suatu situs.
 */
export async function countTestimonials(siteId: string): Promise<number> {
    return contentRepo.countTestimonials(siteId);
}

/**
 * Menghitung jumlah berkas media di suatu situs.
 */
export async function countMediaItems(siteId: string): Promise<number> {
    return mediaRepo.countMediaItems(siteId);
}

/**
 * Menghitung jumlah item galeri di suatu situs.
 */
export async function countGalleryItems(siteId: string): Promise<number> {
    return contentRepo.countGalleryItems(siteId);
}

/**
 * Menghitung jumlah item portofolio di suatu situs.
 */
export async function countPortfolioItems(siteId: string): Promise<number> {
    return contentRepo.countPortfolioItems(siteId);
}

/**
 * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
 */
export async function getMediaSize(siteId: string): Promise<number> {
    return contentRepo.sumMediaSize(siteId);
}
