import * as pageRepo from "../repositories/page.repository";
import { hooks } from "@/modules/shared/core/hooks";

/**
 * Mengambil daftar halaman untuk suatu situs.
 */
export async function getPages(siteId: string) {
    return pageRepo.findPagesBySite(siteId);
}

/**
 * Mengambil data detail halaman berdasarkan ID.
 */
export async function getPageDetail(id: string, siteId: string) {
    const page = await pageRepo.findPageById(id);
    if (!page || page.siteId !== siteId) {
        throw new Error("Page not found");
    }
    return page;
}

/**
 * Menyimpan data halaman (upsert) beserta metadata.
 */
export async function savePage(siteId: string, body: any) {
    const { id, path, title, description, imageUrl, body: contentBody, isPublished, useBuilder, metaData, data } = body;

    if (!path) {
        throw new Error("Missing path");
    }

    if (id) {
        const existing = await pageRepo.findPageById(id);
        if (!existing || existing.siteId !== siteId) {
            throw new Error("Unauthorized");
        }

        let finalData = data;
        
        if (existing && !existing.useBuilder && useBuilder && (!finalData || Object.keys(finalData).length === 0)) {
            finalData = {
                content: [
                    {
                        type: "RichText",
                        props: {
                            id: "migrated-content",
                            content: contentBody || ""
                        }
                    }
                ],
                root: { props: { title } }
            };
        }

        await pageRepo.updatePage(id, {
            path,
            title,
            description,
            imageUrl,
            body: contentBody,
            isPublished,
            useBuilder,
            data: finalData ?? existing?.data ?? {},
        });
    } else {
        const existing = await pageRepo.findPageBySiteAndPath(siteId, path);
        if (existing) {
            throw new Error("Path already exists");
        }

        await pageRepo.createPage({
            siteId,
            path,
            title,
            description,
            imageUrl,
            body: contentBody,
            isPublished: isPublished ?? true,
            useBuilder: useBuilder ?? true,
            data: {},
        });
    }

    const targetPage = id 
        ? await pageRepo.findPageById(id) 
        : await pageRepo.findPageBySiteAndPath(siteId, path);

    if (!targetPage) {
        throw new Error("Failed to retrieve saved page");
    }

    const targetId = targetPage.id;

    if (metaData && Array.isArray(metaData)) {
        await pageRepo.deletePageMetaData(targetId);

        if (metaData.length > 0) {
            const mappedMetadata = metaData.map((m: any) => ({
                key: m.key,
                value: m.value,
                type: m.type || "text",
                pageId: targetId,
            }));
            await pageRepo.createPageMetaData(mappedMetadata);
        }
    }

    // Trigger hooks & cache invalidation
    hooks.doAction("page_saved", targetPage);
    try {
        const { revalidateTag, revalidatePath } = await import("next/cache");
        revalidateTag(`site-${siteId}`, "default");
        revalidatePath(path);
        if (path === "/") {
            revalidatePath("/");
        }
    } catch (cacheError) {
        console.error("Cache revalidation error:", cacheError);
    }

    return { success: true };
}

/**
 * Menghapus halaman.
 */
export async function deletePage(id: string, siteId: string) {
    const existing = await pageRepo.findPageById(id);
    if (!existing || existing.siteId !== siteId) {
        throw new Error("Page not found");
    }

    await pageRepo.deletePage(id);
    return { success: true };
}

/**
 * Mengambil data halaman visual builder (data JSON).
 */
export async function getCredBuildPage(siteId: string, path: string): Promise<any> {
    const page = await pageRepo.findPageBySiteAndPath(siteId, path);
    return page?.data || {};
}

/**
 * Menyimpan data halaman visual builder (data JSON) dan memicu revalidasi cache.
 */
export async function saveCredBuildPage(siteId: string, path: string, data: any): Promise<void> {
    await pageRepo.upsertCredBuildPage(siteId, path, data);
    
    // Purge Next.js cache
    try {
        const { revalidatePath } = await import("next/cache");
        revalidatePath(path);
    } catch (cacheError) {
        console.error("Cache revalidation error for CredBuild page:", cacheError);
    }
}

/**
 * Mengambil detail halaman berdasarkan path di suatu situs.
 */
export async function getPage(path: string, siteId: string) {
    return pageRepo.findPageBySiteAndPathWithMeta(siteId, path);
}
