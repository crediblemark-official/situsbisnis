import { db } from "@/modules/shared/core/db";

export async function findTaxonomyByIdAndSite(id: string, siteId: string) {
    return db.taxonomy.findFirst({
        where: { id, siteId }
    });
}

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

export async function findTermById(termId: string) {
    return db.term.findFirst({
        where: { id: termId },
        include: { taxonomy: true }
    });
}

export async function deleteTerm(termId: string) {
    return db.term.delete({
        where: { id: termId }
    });
}

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

export async function countTaxonomies(siteId: string) {
    return db.taxonomy.count({ where: { siteId } });
}

export async function findTaxonomies(siteId: string, pagination: { skip: number; take: number }) {
    return db.taxonomy.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        take: pagination.take,
        skip: pagination.skip
    });
}

export async function findTaxonomyById(id: string, siteId: string) {
    return db.taxonomy.findFirst({
        where: { id, siteId }
    });
}

export async function createTaxonomy(data: any, siteId: string) {
    return db.taxonomy.create({
        data: { ...data, siteId, updatedAt: new Date() }
    });
}

export async function updateTaxonomy(id: string, siteId: string, data: any) {
    return db.taxonomy.update({
        where: { id },
        data: { ...data, updatedAt: new Date() }
    });
}

export async function deleteTaxonomy(id: string, siteId: string) {
    return db.taxonomy.delete({ where: { id } });
}
