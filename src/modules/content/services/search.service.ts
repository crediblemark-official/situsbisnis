import * as contentRepo from "../repositories/content.repository";
import * as catalogRepo from "@/modules/catalog/repositories/catalog.repository";

export interface SearchResultItem {
    id: string;
    label: string;
    href: string;
    category: string;
    type: "post" | "page" | "product";
}

/**
 * Melakukan pencarian lintas entitas: artikel, halaman, dan produk.
 * Mengembalikan hasil yang digabungkan dengan kategori dan href.
 */
export async function searchAll(siteId: string, q: string): Promise<SearchResultItem[]> {
    if (!q) return [];

    const [posts, pages, products] = await Promise.all([
        contentRepo.searchPosts(siteId, q),
        contentRepo.searchPages(siteId, q),
        catalogRepo.searchProducts(siteId, q)
    ]);

    return [
        ...posts.map(p => ({
            id: p.id,
            label: p.title,
            href: `/dashboard/posts/${p.id}`,
            category: "Artikel",
            type: "post" as const
        })),
        ...pages.map(p => ({
            id: p.id,
            label: p.title,
            href: `/dashboard/pages/${p.id}`,
            category: "Halaman",
            type: "page" as const
        })),
        ...products.map(p => ({
            id: p.id,
            label: p.name,
            href: `/dashboard/products/${p.id}`,
            category: "Produk",
            type: "product" as const
        }))
    ];
}
