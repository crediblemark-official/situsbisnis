import * as contentRepo from "../repositories/content.repository";

/**
 * Mengambil daftar item portofolio di suatu situs.
 */
export async function getPortfolios(siteId: string) {
    return contentRepo.findPortfolioItems(siteId);
}
