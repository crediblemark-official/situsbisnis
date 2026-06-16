import * as contentRepo from "../repositories/content.repository";

export async function countPosts(siteId: string): Promise<number> {
    return contentRepo.countPosts(siteId);
}

export async function countTestimonials(siteId: string): Promise<number> {
    return contentRepo.countTestimonials(siteId);
}
