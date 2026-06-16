import { getSiteId } from "@/lib/domains/tenant";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { ContentClient } from "@/modules/content";
import { CatalogClient } from "@/modules/catalog";

// Posts
export const getPost = cache(async (slug: string, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    // Cache persistent antar request, revalidasi setiap 5 menit
    return unstable_cache(
        async () => {
            return ContentClient.getPost(slug, id);
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
            return ContentClient.getPosts(id);
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
            return CatalogClient.getProducts(id);
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
            return ContentClient.getPage(path, id);
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
            return CatalogClient.getProduct(slug, id);
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
            return ContentClient.getGalleryItems(id);
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
            return ContentClient.getPortfolios(id);
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
            return ContentClient.getTestimonials(id);
        },
        [`testimonials-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "testimonials"] }
    )();
});
