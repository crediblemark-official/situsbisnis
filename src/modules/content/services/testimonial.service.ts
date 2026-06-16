import * as contentRepo from "../repositories/content.repository";

/**
 * Mengambil daftar testimoni disetujui di suatu situs.
 */
export async function getTestimonials(siteId: string) {
    return contentRepo.findApprovedTestimonials(siteId);
}
