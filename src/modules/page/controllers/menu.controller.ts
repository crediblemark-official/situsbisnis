import * as menuService from "../ui/menu";

/**
 * Server Actions / Wrapper internal untuk mengambil menu.
 */
export async function getMenuInternal(slug: string, siteId: string) {
    return menuService.getMenu(slug, siteId);
}

/**
 * Server Actions / Wrapper internal untuk memperbarui menu.
 */
export async function updateMenuInternal(slug: string, items: any[], siteId: string) {
    return menuService.updateMenu(slug, items, siteId);
}
