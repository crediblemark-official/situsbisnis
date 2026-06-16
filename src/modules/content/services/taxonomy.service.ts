import * as taxonomyRepo from "../repositories/taxonomy.repository";

/**
 * Mengambil terms berdasarkan taxonomyId.
 */
export async function getTerms(taxonomyId: string, siteId: string) {
    const taxonomy = await taxonomyRepo.findTaxonomyByIdAndSite(taxonomyId, siteId);
    if (!taxonomy) {
        throw new Error("Taxonomy not found");
    }

    return taxonomyRepo.findTermsByTaxonomyId(taxonomyId);
}

/**
 * Membuat term baru di taksonomi.
 */
export async function createTerm(taxonomyId: string, siteId: string, data: any) {
    const taxonomy = await taxonomyRepo.findTaxonomyByIdAndSite(taxonomyId, siteId);
    if (!taxonomy) {
        throw new Error("Taxonomy not found");
    }

    return taxonomyRepo.createTerm({
        ...data,
        taxonomyId,
    });
}

/**
 * Menghapus term.
 */
export async function deleteTerm(termId: string, siteId: string) {
    const term = await taxonomyRepo.findTermById(termId);
    if (!term || term.taxonomy.siteId !== siteId) {
        throw new Error("Term not found");
    }

    await taxonomyRepo.deleteTerm(termId);
    return { success: true };
}

/**
 * Memperbarui data term.
 */
export async function updateTerm(termId: string, siteId: string, data: any) {
    const term = await taxonomyRepo.findTermById(termId);
    if (!term || term.taxonomy.siteId !== siteId) {
        throw new Error("Term not found");
    }

    return taxonomyRepo.updateTerm(termId, data);
}
