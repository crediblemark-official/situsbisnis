import { db } from "@/modules/shared/core/db";
import * as menuRepo from "../repositories/menu.repository";
import { cache } from "react";
import { unstable_cache } from "next/cache";

export type MenuWithItems = any;

/**
 * Mengambil data menu situs (lazy initialization untuk menu 'main' dan 'footer').
 */
export const getMenu = cache(async (slug: string, siteId: string): Promise<MenuWithItems | null> => {
    if (!siteId) return null;

    return unstable_cache(
        async () => {
            const menu = await menuRepo.findMenuBySlug(siteId, slug);

            // Lazy initialization menu default 'main' dan 'footer'
            if (!menu && (slug === 'main' || slug === 'footer')) {
                const newMenu = await menuRepo.createMenu({
                    siteId,
                    name: slug === 'main' ? 'Main Menu' : 'Footer Menu',
                    slug,
                    items: slug === 'main' ? [
                        { label: "Home", url: "/", order: 0, target: "_self" },
                        { label: "Blog", url: "/blog", order: 1, target: "_self" },
                        { label: "Shop", url: "/shop", order: 2, target: "_self" }
                    ] : undefined
                });

                return newMenu;
            }

            return menu;
        },
        [`menu-${siteId}-${slug}`],
        {
            revalidate: 600, // 10 menit
            tags: [`site-${siteId}`, `menu-${slug}`]
        }
    )();
});

/**
 * Memperbarui data items di dalam menu.
 */
export async function updateMenu(slug: string, items: Array<{ label: string; url: string; order: number; target?: string }>, siteId: string) {
    if (!siteId) throw new Error("No site context found for menu update");

    let menu = await getMenu(slug, siteId);

    if (!menu) {
        // Jika menu belum terinisiasi, buat yang baru
        menu = await menuRepo.createMenu({
            siteId,
            name: slug,
            slug
        });
    }

    // Melakukan penghapusan dan pengisian items menu dalam transaksi DB
    await db.$transaction(async (tx) => {
        await menuRepo.deleteMenuItems(tx, menu.id);
        if (items.length > 0) {
            await menuRepo.createMenuItems(tx, menu.id, items);
        }
    });

    // Invalidasi cache
    try {
        const { revalidateTag } = await import("next/cache");
        revalidateTag(`site-${siteId}`, "default");
        revalidateTag(`menu-${slug}`, "default");
    } catch (cacheError) {
        console.error("[updateMenu] Failed to revalidate cache:", cacheError);
    }

    return getMenu(slug, siteId);
}
