import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { IdentityClient } from "@/lib/modules/identity/client";

// Posts
export const getPost = cache(async (slug: string, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    // Cache persistent antar request, revalidasi setiap 5 menit
    return unstable_cache(
        async () => {
            const post = await db.post.findUnique({
                where: { siteId_slug: { siteId: id, slug } },
                include: {
                    metaData: true
                }
            });

            if (!post) return null;

            let authorName = null;
            if (post.authorId) {
                const author = await IdentityClient.getUserById(post.authorId);
                authorName = author?.name || null;
            }

            return { ...post, authorName };
        },
        [`post-${id}-${slug}`],
        { revalidate: 300, tags: [`site-${id}`, `post-${slug}`] }
    )();
});

export const getPosts = cache(async (siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return [];

    // Cache persistent antar request, revalidasi setiap 5 menit
    return unstable_cache(
        async () => {
            return await db.post.findMany({
                where: { published: true, siteId: id },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    imageUrl: true,
                    excerpt: true,
                    createdAt: true,
                }
            });
        },
        [`posts-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "posts"] }
    )();
});

export const getProducts = cache(async (siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return [];

    // Cache persistent antar request, revalidasi setiap 5 menit
    return unstable_cache(
        async () => {
            return await db.product.findMany({
                where: { isArchived: false, siteId: id },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    originalPrice: true,
                    images: true,
                    createdAt: true,
                    stock: true,
                }
            });
        },
        [`products-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "products"] }
    )();
});

// Pages
export const getPage = cache(async (path: string, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    return unstable_cache(
        async () => {
            return await db.credBuildPage.findUnique({
                where: { siteId_path: { siteId: id, path } },
                include: { metaData: true }
            });
        },
        [`page-${id}-${path}`],
        { revalidate: 300, tags: [`site-${id}`, `page-${path}`] }
    )();
});

// Products
export const getProduct = cache(async (slug: string, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    // Cache persistent antar request, revalidasi setiap 5 menit
    return unstable_cache(
        async () => {
            return await db.product.findUnique({
                where: { siteId_slug: { siteId: id, slug } },
                include: { metaData: true, terms: true, seoMeta: true }
            });
        },
        [`product-${id}-${slug}`],
        { revalidate: 300, tags: [`site-${id}`, `product-${slug}`, "products"] }
    )();
});

// Gallery
export const getGalleryItems = cache(async (siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return [];

    return unstable_cache(
        async () => {
            try {
                return await db.galleryItem.findMany({
                    where: { siteId: id },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        url: true,
                        title: true,
                        description: true,
                        createdAt: true
                    }
                });
            } catch (error) {
                console.error("Error fetching gallery items:", error);
                return [];
            }
        },
        [`gallery-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "gallery"] }
    )();
});

// Portfolios
export const getPortfolios = cache(async (siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return [];

    return unstable_cache(
        async () => {
            try {
                return await db.portfolioItem.findMany({
                    where: { siteId: id },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        imageUrl: true,
                        link: true,
                        description: true,
                        createdAt: true
                    }
                });
            } catch (error) {
                console.error("Error fetching portfolios:", error);
                return [];
            }
        },
        [`portfolio-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "portfolio"] }
    )();
});

// Testimonials
export const getTestimonials = cache(async (siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return [];

    return unstable_cache(
        async () => {
            try {
                return await db.testimonial.findMany({
                    where: { isApproved: true, siteId: id },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        quote: true,
                        author: true,
                        role: true,
                        avatarUrl: true,
                        rating: true,
                        createdAt: true
                    }
                });
            } catch (error) {
                console.error("Error fetching testimonials:", error);
                return [];
            }
        },
        [`testimonials-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "testimonials"] }
    )();
});
