import * as contentRepo from "../repositories/content.repository";

/**
 * Mengambil daftar media galeri di suatu situs.
 */
export async function getGalleryItems(siteId: string) {
    return contentRepo.findGalleryItems(siteId);
}
