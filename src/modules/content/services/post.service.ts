import * as contentRepo from "../repositories/content.repository";
import { IdentityClient } from "@/lib/modules/identity/client";

/**
 * Mengambil detail artikel (post) berdasarkan slug di suatu situs.
 */
export async function getPost(slug: string, siteId: string) {
    const post = await contentRepo.findPostBySlug(siteId, slug);
    if (!post) return null;

    let authorName = null;
    if (post.authorId) {
        const author = await IdentityClient.getUserById(post.authorId);
        authorName = author?.name || null;
    }

    return { ...post, authorName };
}

/**
 * Mengambil daftar seluruh artikel aktif di suatu situs.
 */
export async function getPosts(siteId: string) {
    return contentRepo.findPublishedPosts(siteId);
}
