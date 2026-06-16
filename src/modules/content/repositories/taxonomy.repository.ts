import { db } from "@/modules/shared/core/db";

/**
 * Mencari taksonomi berdasarkan ID dan siteId.
 */
export async function findTaxonomyByIdAndSite(id: string, siteId: string) {
    return db.taxonomy.findFirst({
        where: { id, siteId }
    });
}

/**
 * Mengambil daftar istilah (terms) berdasarkan taxonomyId.
 */
export async function findTermsByTaxonomyId(taxonomyId: string) {
    return db.term.findMany({
        where: { taxonomyId },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true
        }
    });
}

/**
 * Membuat term baru.
 */
export async function createTerm(data: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    taxonomyId: string;
}) {
    return db.term.create({
        data
    });
}

/**
 * Mencari term berdasarkan ID beserta relasi taksonominya.
 */
export async function findTermById(termId: string) {
    return db.term.findFirst({
        where: { id: termId },
        include: { taxonomy: true }
    });
}

/**
 * Menghapus term.
 */
export async function deleteTerm(termId: string) {
    return db.term.delete({
        where: { id: termId }
    });
}

/**
 * Memperbarui term.
 */
export async function updateTerm(termId: string, data: {
    name?: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
}) {
    return db.term.update({
        where: { id: termId },
        data
    });
}
