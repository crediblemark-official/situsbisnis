import * as contentService from "../services/content.service";
import * as searchService from "../services/search.service";
import * as taxonomyService from "../services/taxonomy.service";
import * as postService from "../services/post.service";
import * as testimonialService from "../services/testimonial.service";

export async function countPostsInternal(siteId: string): Promise<number> {
    return contentService.countPosts(siteId);
}

export async function countTestimonialsInternal(siteId: string): Promise<number> {
    return contentService.countTestimonials(siteId);
}

export async function getTermsInternal(taxonomyId: string, siteId: string) {
    return taxonomyService.getTerms(taxonomyId, siteId);
}

export async function createTermInternal(taxonomyId: string, siteId: string, data: any) {
    return taxonomyService.createTerm(taxonomyId, siteId, data);
}

export async function deleteTermInternal(termId: string, siteId: string) {
    return taxonomyService.deleteTerm(termId, siteId);
}

export async function updateTermInternal(termId: string, siteId: string, data: any) {
    return taxonomyService.updateTerm(termId, siteId, data);
}

export async function searchAllInternal(siteId: string, q: string) {
    return searchService.searchAll(siteId, q);
}

export async function getPostInternal(slug: string, siteId: string) {
    return postService.getPost(slug, siteId);
}

export async function getPostsInternal(siteId: string) {
    return postService.getPosts(siteId);
}

export async function getTestimonialsInternal(siteId: string) {
    return testimonialService.getTestimonials(siteId);
}
