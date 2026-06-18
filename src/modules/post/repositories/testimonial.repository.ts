import { db } from "@/modules/shared/core/db";

export async function countTestimonials(siteId: string, where?: any) {
    return db.testimonial.count({ where: { siteId, ...(where || {}) } });
}

export async function findTestimonials(siteId: string, pagination: { skip: number; take: number }, where?: any) {
    return db.testimonial.findMany({
        where: { siteId, ...(where || {}) },
        orderBy: { createdAt: 'desc' },
        take: pagination.take,
        skip: pagination.skip
    });
}

export async function findTestimonialById(id: string, siteId: string) {
    return db.testimonial.findFirst({ where: { id, siteId } });
}

export async function createTestimonial(data: any, siteId: string) {
    return db.testimonial.create({
        data: { ...data, siteId, updatedAt: new Date() }
    });
}

export async function updateTestimonial(id: string, siteId: string, data: any) {
    return db.testimonial.update({
        where: { id },
        data: { ...data, updatedAt: new Date() }
    });
}

export async function deleteTestimonial(id: string, siteId: string) {
    return db.testimonial.delete({ where: { id } });
}
