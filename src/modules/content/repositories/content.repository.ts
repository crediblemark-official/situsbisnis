import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah artikel/post di suatu situs.
 */
export async function countPosts(siteId: string): Promise<number> {
    return db.post.count({
        where: { siteId }
    });
}

/**
 * Menghitung jumlah testimoni di suatu situs.
 */
export async function countTestimonials(siteId: string): Promise<number> {
    return db.testimonial.count({
        where: { siteId }
    });
}

/**
 * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
 */
export async function sumMediaSize(siteId: string): Promise<number> {
    const result = await db.mediaItem.aggregate({
        where: { siteId },
        _sum: {
            size: true
        }
    });
    return result._sum.size || 0;
}

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
 * Mencari taksonomi berdasarkan ID dan siteId.
 */
export async function findTaxonomyByIdAndSite(id: string, siteId: string) {
    return db.taxonomy.findFirst({
        where: { id, siteId }
    });
}

/**
 * Mengambil daftar istilah (terms) berdasarkan taxonomyId.
 */
export async function findTermsByTaxonomyId(taxonomyId: string) {
    return db.term.findMany({
        where: { taxonomyId },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            parentId: true
        }
    });
}

/**
 * Membuat term baru.
 */
export async function createTerm(data: {
    name: string;
    slug: string;
    description?: string | null;
    parentId?: string | null;
    taxonomyId: string;
}) {
    return db.term.create({
        data
    });
}

/**
 * Mencari term berdasarkan ID beserta relasi taksonominya.
 */
export async function findTermById(termId: string) {
    return db.term.findFirst({
        where: { id: termId },
        include: { taxonomy: true }
    });
}

/**
 * Menghapus term.
 */
export async function deleteTerm(termId: string) {
    return db.term.delete({
        where: { id: termId }
    });
}

/**
 * Memperbarui term.
 */
export async function updateTerm(termId: string, data: {
    name?: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
}) {
    return db.term.update({
        where: { id: termId },
        data
    });
}

