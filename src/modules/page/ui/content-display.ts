import { getSiteId } from "@/modules/shared/utils/domains/tenant";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PostClient } from "@/modules/post";
import { getPage as getPageFromService } from "../services/page.service";
import { MediaClient } from "@/modules/media";
import { eventBus } from "@/modules/shared/core/event-bus";

// Posts
export const getPost = cache(async (slug: string, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    // Cache persistent antar request, revalidasi setiap 5 menit
    return unstable_cache(
        async () => {
            return PostClient.getPost(slug, id);
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
            return PostClient.getPosts(id);
        },
        [`posts-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "posts"] }
    )();
});

// Menggunakan eventBus untuk mengambil data dari modul catalog secara asinkron
export const getProducts = cache(async (siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return [];

    return unstable_cache(
        async () => {
            try {
                return await eventBus.request("request.catalog.getProducts", { siteId: id });
            } catch (err) {
                console.error("[ContentDisplayService] Gagal memuat produk via eventBus:", err);
                return [];
            }
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
            return getPageFromService(path, id);
        },
        [`page-${id}-${path}`],
        { revalidate: 300, tags: [`site-${id}`, `page-${path}`] }
    )();
});

// Menggunakan eventBus untuk mengambil data produk spesifik dari modul catalog secara asinkron
export const getProduct = cache(async (slug: string, siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    return unstable_cache(
        async () => {
            try {
                return await eventBus.request("request.catalog.getProduct", { slug, siteId: id });
            } catch (err) {
                console.error(`[ContentDisplayService] Gagal memuat produk ${slug} via eventBus:`, err);
                return null;
            }
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
            return MediaClient.getGalleryItems(id);
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
            return MediaClient.getPortfolios(id);
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
            return PostClient.getTestimonials(id);
        },
        [`testimonials-${id}`],
        { revalidate: 300, tags: [`site-${id}`, "testimonials"] }
    )();
});
