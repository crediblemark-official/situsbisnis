import { db } from "@/modules/shared/core/db";

/**
 * Mengambil seluruh halaman untuk suatu situs.
 */
export async function findPagesBySite(siteId: string) {
    return db.credBuildPage.findMany({
        where: { siteId },
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            path: true,
            title: true,
            description: true,
            isPublished: true,
            useBuilder: true,
            updatedAt: true
        }
    });
}

/**
 * Mencari halaman berdasarkan ID beserta metadata dan seoMeta.
 */
export async function findPageById(id: string) {
    return db.credBuildPage.findUnique({
        where: { id },
        include: {
            metaData: true,
            seoMeta: true,
        }
    });
}

/**
 * Mencari halaman berdasarkan siteId dan path.
 */
export async function findPageBySiteAndPath(siteId: string, path: string) {
    return db.credBuildPage.findUnique({
        where: {
            siteId_path: { siteId, path }
        }
    });
}

/**
 * Membuat data halaman baru.
 */
export async function createPage(data: {
    siteId: string;
    path: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    body?: string | null;
    isPublished?: boolean;
    useBuilder?: boolean;
    data?: any;
}) {
    return db.credBuildPage.create({
        data: {
            siteId: data.siteId,
            path: data.path,
            title: data.title,
            description: data.description,
            imageUrl: data.imageUrl,
            body: data.body,
            isPublished: data.isPublished ?? true,
            useBuilder: data.useBuilder ?? true,
            data: data.data ?? {},
        }
    });
}

/**
 * Memperbarui data halaman.
 */
export async function updatePage(id: string, data: {
    path?: string;
    title?: string;
    description?: string | null;
    imageUrl?: string | null;
    body?: string | null;
    isPublished?: boolean;
    useBuilder?: boolean;
    data?: any;
}) {
    return db.credBuildPage.update({
        where: { id },
        data: {
            ...data,
            updatedAt: new Date()
        }
    });
}

/**
 * Menghapus data halaman.
 */
export async function deletePage(id: string) {
    return db.credBuildPage.delete({
        where: { id }
    });
}

/**
 * Menghapus seluruh metadata halaman terkait.
 */
export async function deletePageMetaData(pageId: string) {
    return db.metaData.deleteMany({
        where: { pageId }
    });
}

/**
 * Membuat data metadata halaman secara massal.
 */
export async function createPageMetaData(metaData: {
    key: string;
    value: string;
    type?: string;
    pageId: string;
}[]) {
    return db.metaData.createMany({
        data: metaData
    });
}

/**
 * Melakukan upsert data halaman visual builder (CredBuildPage).
 */
export async function upsertCredBuildPage(siteId: string, path: string, data: any) {
    return db.credBuildPage.upsert({
        where: {
            siteId_path: { siteId, path }
        },
        update: {
            data: data,
            useBuilder: true,
            updatedAt: new Date()
        },
        create: {
            siteId,
            path,
            data: data,
            useBuilder: true,
            updatedAt: new Date()
        }
    });
}
