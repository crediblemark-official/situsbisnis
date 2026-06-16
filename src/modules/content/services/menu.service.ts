import { getSiteId } from "@/modules/shared/utils/domains/tenant";
import { ContentClient } from "@/modules/content";

export type MenuWithItems = any;

/**
 * Proxy delegator ke ContentClient untuk mengambil data menu situs.
 */
export const getMenu = async (slug: string, siteId?: string): Promise<MenuWithItems | null> => {
    const id = siteId || await getSiteId();
    if (!id) return null;
    return ContentClient.getMenu(slug, id);
};

/**
 * Proxy delegator ke ContentClient untuk memperbarui data menu situs.
 */
export const updateMenu = async (
    slug: string, 
    items: Array<{ label: string; url: string; order: number; target?: string }>, 
    siteId?: string
) => {
    const id = siteId || await getSiteId();
    if (!id) throw new Error("No site context found for menu update");
    return ContentClient.updateMenu(slug, items, id);
};
