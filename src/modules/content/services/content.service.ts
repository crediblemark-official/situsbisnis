import * as contentRepo from "../repositories/content.repository";
import { hooks } from "@/modules/shared/core/hooks";

/**
 * Menghitung jumlah artikel/post di suatu situs.
 */
export async function countPosts(siteId: string): Promise<number> {
    return contentRepo.countPosts(siteId);
}

/**
 * Menghitung jumlah testimoni di suatu situs.
 */
export async function countTestimonials(siteId: string): Promise<number> {
    return contentRepo.countTestimonials(siteId);
}

/**
 * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
 */
export async function getMediaSize(siteId: string): Promise<number> {
    return contentRepo.sumMediaSize(siteId);
}

/**
 * Mengambil daftar halaman untuk suatu situs.
 */
export async function getPages(siteId: string) {
    return contentRepo.findPagesBySite(siteId);
}

/**
 * Mengambil data detail halaman berdasarkan ID.
 */
export async function getPageDetail(id: string, siteId: string) {
    const page = await contentRepo.findPageById(id);
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
        const existing = await contentRepo.findPageById(id);
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

        await contentRepo.updatePage(id, {
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
        const existing = await contentRepo.findPageBySiteAndPath(siteId, path);
        if (existing) {
            throw new Error("Path already exists");
        }

        await contentRepo.createPage({
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
        ? await contentRepo.findPageById(id) 
        : await contentRepo.findPageBySiteAndPath(siteId, path);

    if (!targetPage) {
        throw new Error("Failed to retrieve saved page");
    }

    const targetId = targetPage.id;

    if (metaData && Array.isArray(metaData)) {
        await contentRepo.deletePageMetaData(targetId);

        if (metaData.length > 0) {
            const mappedMetadata = metaData.map((m: any) => ({
                key: m.key,
                value: m.value,
                type: m.type || "text",
                pageId: targetId,
            }));
            await contentRepo.createPageMetaData(mappedMetadata);
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
    const existing = await contentRepo.findPageById(id);
    if (!existing || existing.siteId !== siteId) {
        throw new Error("Page not found");
    }

    await contentRepo.deletePage(id);
    return { success: true };
}

/**
 * Mengambil terms berdasarkan taxonomyId.
 */
export async function getTerms(taxonomyId: string, siteId: string) {
    const taxonomy = await contentRepo.findTaxonomyByIdAndSite(taxonomyId, siteId);
    if (!taxonomy) {
        throw new Error("Taxonomy not found");
    }

    return contentRepo.findTermsByTaxonomyId(taxonomyId);
}

/**
 * Membuat term baru di taksonomi.
 */
export async function createTerm(taxonomyId: string, siteId: string, data: any) {
    const taxonomy = await contentRepo.findTaxonomyByIdAndSite(taxonomyId, siteId);
    if (!taxonomy) {
        throw new Error("Taxonomy not found");
    }

    return contentRepo.createTerm({
        ...data,
        taxonomyId,
    });
}

/**
 * Menghapus term.
 */
export async function deleteTerm(termId: string, siteId: string) {
    const term = await contentRepo.findTermById(termId);
    if (!term || term.taxonomy.siteId !== siteId) {
        throw new Error("Term not found");
    }

    await contentRepo.deleteTerm(termId);
    return { success: true };
}

/**
 * Memperbarui data term.
 */
export async function updateTerm(termId: string, siteId: string, data: any) {
    const term = await contentRepo.findTermById(termId);
    if (!term || term.taxonomy.siteId !== siteId) {
        throw new Error("Term not found");
    }

    return contentRepo.updateTerm(termId, data);
}

