import { db } from "@/modules/shared/core/db";

/**
 * Mencari menu berdasarkan siteId dan slug.
 */
export async function findMenuBySlug(siteId: string, slug: string) {
    return db.menu.findUnique({
        where: {
            siteId_slug: {
                siteId,
                slug
            }
        },
        include: {
            items: {
                orderBy: { order: 'asc' }
            }
        }
    });
}

/**
 * Membuat menu baru beserta items-nya (jika ada).
 */
export async function createMenu(data: {
    siteId: string;
    name: string;
    slug: string;
    items?: Array<{ label: string; url: string; order: number; target?: string }>;
}) {
    return db.menu.create({
        data: {
            siteId: data.siteId,
            name: data.name,
            slug: data.slug,
            items: data.items ? {
                create: data.items.map(item => ({
                    label: item.label,
                    url: item.url,
                    order: item.order,
                    target: item.target || "_self"
                }))
            } : undefined
        },
        include: {
            items: {
                orderBy: { order: 'asc' }
            }
        }
    });
}

/**
 * Menghapus seluruh items menu tertentu.
 */
export async function deleteMenuItems(tx, menuId: string) {
    const client = tx || db;
    return client.menuItem.deleteMany({
        where: { menuId }
    });
}

/**
 * Membuat items menu baru.
 */
export async function createMenuItems(tx, menuId: string, items: Array<{ label: string; url: string; order: number; target?: string }>) {
    const client = tx || db;
    return client.menuItem.createMany({
        data: items.map(item => ({
            menuId,
            label: item.label,
            url: item.url,
            order: item.order,
            target: item.target || "_self"
        }))
    });
}
