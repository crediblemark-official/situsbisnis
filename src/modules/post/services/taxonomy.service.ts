import * as taxonomyRepo from "../repositories/taxonomy.repository";
import { buildPagination, publishCrudEvent } from "@/modules/shared/core/crud-base";
import { AppError } from "@/modules/shared/utils/api/errors";

export async function getTerms(taxonomyId: string, siteId: string) {
    const taxonomy = await taxonomyRepo.findTaxonomyByIdAndSite(taxonomyId, siteId);
    if (!taxonomy) {
        throw new Error("Taxonomy not found");
    }

    return taxonomyRepo.findTermsByTaxonomyId(taxonomyId);
}

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

export async function deleteTerm(termId: string, siteId: string) {
    const term = await taxonomyRepo.findTermById(termId);
    if (!term || term.taxonomy.siteId !== siteId) {
        throw new Error("Term not found");
    }

    await taxonomyRepo.deleteTerm(termId);
    return { success: true };
}

export async function updateTerm(termId: string, siteId: string, data: any) {
    const term = await taxonomyRepo.findTermById(termId);
    if (!term || term.taxonomy.siteId !== siteId) {
        throw new Error("Term not found");
    }

    return taxonomyRepo.updateTerm(termId, data);
}

export async function listTaxonomies(siteId: string, searchParams: URLSearchParams) {
    const { page, limit, skip } = buildPagination(searchParams);

    const total = await taxonomyRepo.countTaxonomies(siteId);
    const items = await taxonomyRepo.findTaxonomies(siteId, { skip, take: limit });

    return {
        data: items,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
}

export async function createTaxonomy(siteId: string, data: any) {
    const { id: _extractedId, ...rest } = data;

    const created = await taxonomyRepo.createTaxonomy(rest, siteId);
    await publishCrudEvent("crud.created", "taxonomy", siteId, created);

    return { success: true, item: created };
}

export async function getTaxonomyDetail(id: string, siteId: string) {
    const taxonomy = await taxonomyRepo.findTaxonomyById(id, siteId);
    if (!taxonomy) throw new AppError("Item not found", 404);
    return taxonomy;
}

export async function updateTaxonomy(id: string, siteId: string, data: any) {
    const existing = await taxonomyRepo.findTaxonomyById(id, siteId);
    if (!existing) throw new AppError("Not Found or Unauthorized", 404);

    const { id: _extractedId, ...rest } = data;

    const updated = await taxonomyRepo.updateTaxonomy(id, siteId, rest);
    await publishCrudEvent("crud.updated", "taxonomy", siteId, updated);

    return { success: true, item: updated };
}

export async function deleteTaxonomy(id: string, siteId: string) {
    const existing = await taxonomyRepo.findTaxonomyById(id, siteId);
    if (!existing) throw new AppError("Item not found", 404);

    await taxonomyRepo.deleteTaxonomy(id, siteId);
    await publishCrudEvent("crud.deleted", "taxonomy", siteId, existing);

    return { success: true };
}

export async function archiveTaxonomy(id: string, siteId: string, isArchived: boolean) {
    const existing = await taxonomyRepo.findTaxonomyById(id, siteId);
    if (!existing) throw new AppError("Not Found or Unauthorized", 404);

    return taxonomyRepo.updateTaxonomy(id, siteId, { isArchived } as any);
}
