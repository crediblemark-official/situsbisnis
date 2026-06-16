import { db } from "@/lib/core/db";
import { Prisma } from "@prisma/client";
import { getSiteId } from "@/lib/domains/tenant";
import { cache } from "react";

export type MenuWithItems = Prisma.MenuGetPayload<{
    include: { items: true }
}>;

import { unstable_cache } from "next/cache";

export const getMenu = cache(async (slug: string, siteId?: string): Promise<MenuWithItems | null> => {
    const id = siteId || await getSiteId();
    if (!id) return null;

    return unstable_cache(
        async () => {
            const menu = await db.menu.findUnique({
                where: { 
                    siteId_slug: {
                        siteId: id,
                        slug
                    }
                },
                include: {
                    items: {
                        orderBy: { order: 'asc' }
                    }
                }
            });

            // If menu doesn't exist, create it dynamically (lazy init for 'main' and 'footer')
            if (!menu && (slug === 'main' || slug === 'footer')) {
                const newMenu = await db.menu.create({
                    data: {
                        siteId: id,
                        name: slug === 'main' ? 'Main Menu' : 'Footer Menu',
                        slug,
                        items: slug === 'main' ? {
                            create: [
                                { label: "Home", url: "/", order: 0, target: "_self" },
                                { label: "Blog", url: "/blog", order: 1, target: "_self" },
                                { label: "Shop", url: "/shop", order: 2, target: "_self" }
                            ]
                        } : undefined
                    },
                    include: {
                        items: {
                            orderBy: { order: 'asc' }
                        }
                    }
                });

                return newMenu;
            }

            return menu;
        },
        [`menu-${id}-${slug}`],
        { 
            revalidate: 600, // 10 minutes
            tags: [`site-${id}`, `menu-${slug}`] 
        }
    )();
});

export const updateMenu = async (slug: string, items: { label: string; url: string; order: number; target?: string }[], siteId?: string) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("No site context found for menu update");

    let menu = await getMenu(slug, id);

    if (!menu) {
        // should have been created by getMenu if it was a default one, otherwise create it
        const newMenu = await db.menu.create({
            data: { 
                siteId: id,
                name: slug, 
                slug 
            },
            include: { items: true }
        });
        menu = newMenu;
    }

    // Transaction-like replacement
    await db.$transaction(async (tx) => {
        // Delete all items
        await tx.menuItem.deleteMany({
            where: { menuId: menu!.id }
        });

        // Insert new items
        if (items.length > 0) {
            await tx.menuItem.createMany({
                data: items.map(item => ({
                    menuId: menu!.id,
                    label: item.label,
                    url: item.url,
                    order: item.order,
                    target: item.target || "_self"
                }))
            });
        }
    });

    return getMenu(slug, id);
};
