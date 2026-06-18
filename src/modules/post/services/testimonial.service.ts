import * as contentRepo from "../repositories/content.repository";
import * as testimonialRepo from "../repositories/testimonial.repository";
import { buildPagination, fetchWithCache, publishCrudEvent, checkResourceLimit } from "@/modules/shared/core/crud-base";
import { AppError } from "@/modules/shared/utils/api/errors";

export async function getTestimonial(siteId: string, id: string) {
    return contentRepo.findTestimonialById(siteId, id);
}

export async function getTestimonials(siteId: string) {
    return contentRepo.findApprovedTestimonials(siteId);
}

function transformTestimonialData(data: any, session: any) {
    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "editor";
    return {
        ...data,
        isApproved: data.isApproved !== undefined ? data.isApproved : isAdmin,
    };
}

export async function listTestimonials(siteId: string, searchParams: URLSearchParams) {
    const { page, limit, skip } = buildPagination(searchParams);
    const whereCondition: any = {};

    const statusParam = searchParams.get('status');
    if (statusParam !== 'all') {
        whereCondition.isApproved = true;
    }

    const result = await fetchWithCache(
        `testimonial-list-${siteId}-${page}-${limit}-${JSON.stringify(whereCondition)}`,
        async () => {
            const total = await testimonialRepo.countTestimonials(siteId, whereCondition);
            const items = await testimonialRepo.findTestimonials(siteId, { skip, take: limit }, whereCondition);
            return {
                data: items,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
            };
        },
        [`site-${siteId}`, `site-${siteId}-testimonial`]
    );

    return { testimonials: result.data, pagination: result.pagination };
}

export async function createTestimonial(siteId: string, data: any, session: any) {
    const { id: _extractedId, ...rest } = data;
    const finalData = transformTestimonialData(rest, session);

    const limitCheck = await checkResourceLimit(siteId, "maxTestimonials");
    if (!limitCheck.allowed) throw new AppError(limitCheck.message, 403);

    const created = await testimonialRepo.createTestimonial(finalData, siteId);
    await publishCrudEvent("crud.created", "testimonial", siteId, created);

    return { success: true, item: created, testimonial: created };
}

export async function getTestimonialDetail(id: string, siteId: string) {
    const testimonial = await testimonialRepo.findTestimonialById(id, siteId);
    if (!testimonial) throw new AppError("Item not found", 404);
    return testimonial;
}

export async function updateTestimonial(id: string, siteId: string, data: any, session: any) {
    const existing = await testimonialRepo.findTestimonialById(id, siteId);
    if (!existing) throw new AppError("Not Found or Unauthorized", 404);

    const { id: _extractedId, ...rest } = data;
    const finalData = transformTestimonialData(rest, session);

    const updated = await testimonialRepo.updateTestimonial(id, siteId, finalData);
    await publishCrudEvent("crud.updated", "testimonial", siteId, updated);

    return { success: true, item: updated, testimonial: updated };
}

export async function deleteTestimonial(id: string, siteId: string) {
    const existing = await testimonialRepo.findTestimonialById(id, siteId);
    if (!existing) throw new AppError("Item not found", 404);

    await testimonialRepo.deleteTestimonial(id, siteId);
    await publishCrudEvent("crud.deleted", "testimonial", siteId, existing);

    return { success: true };
}

export async function archiveTestimonial(id: string, siteId: string, isArchived: boolean) {
    const existing = await testimonialRepo.findTestimonialById(id, siteId);
    if (!existing) throw new AppError("Not Found or Unauthorized", 404);

    return testimonialRepo.updateTestimonial(id, siteId, { isArchived } as any);
}
