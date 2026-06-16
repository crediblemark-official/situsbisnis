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
 * Menghitung jumlah item galeri di suatu situs.
 */
export async function countGalleryItems(siteId: string): Promise<number> {
    return db.galleryItem.count({
        where: { siteId }
    });
}

/**
 * Menghitung jumlah item portofolio di suatu situs.
 */
export async function countPortfolioItems(siteId: string): Promise<number> {
    return db.portfolioItem.count({
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

/**
 * Mengambil daftar media items berdasarkan siteId dan folderId.
 */
export async function findMediaItems(siteId: string, folderId: string | null, limit: number, skip: number) {
    return db.mediaItem.findMany({
        where: {
            siteId,
            folderId: folderId === "root" ? null : folderId
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
        select: {
            id: true,
            url: true,
            filename: true,
            mimeType: true,
            size: true,
            createdAt: true,
            folderId: true,
        }
    });
}

/**
 * Menghitung jumlah total media items di suatu situs.
 */
export async function countMediaItems(siteId: string): Promise<number> {
    return db.mediaItem.count({
        where: { siteId }
    });
}

/**
 * Membuat media item baru.
 */
export async function createMediaItem(data: {
    siteId: string;
    folderId?: string | null;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    width?: number | null;
    height?: number | null;
    blurDataURL?: string | null;
}) {
    return db.mediaItem.create({
        data: {
            site: { connect: { id: data.siteId } },
            folder: data.folderId && data.folderId !== "root" ? { connect: { id: data.folderId } } : undefined,
            url: data.url,
            filename: data.filename,
            mimeType: data.mimeType,
            size: data.size,
            width: data.width,
            height: data.height,
            blurDataURL: data.blurDataURL
        }
    });
}

/**
 * Mencari media item berdasarkan ID dan siteId.
 */
export async function findMediaItemByIdAndSite(id: string, siteId: string) {
    return db.mediaItem.findFirst({
        where: { id, siteId }
    });
}

/**
 * Menghapus media item.
 */
export async function deleteMediaItem(id: string) {
    return db.mediaItem.delete({
        where: { id }
    });
}

/**
 * Mengambil daftar folder media berdasarkan siteId dan parentId.
 */
export async function findMediaFolders(siteId: string, parentId: string | null) {
    return db.mediaFolder.findMany({
        where: {
            siteId,
            parentId: parentId
        },
        select: {
            id: true,
            name: true,
            parentId: true,
            _count: {
                select: { items: true, children: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

/**
 * Membuat folder media baru.
 */
export async function createMediaFolder(data: {
    name: string;
    siteId: string;
    parentId?: string | null;
}) {
    return db.mediaFolder.create({
        data: {
            name: data.name,
            siteId: data.siteId,
            parentId: data.parentId || null
        }
    });
}

/**
 * Mencari folder media berdasarkan ID dan siteId.
 */
export async function findMediaFolderByIdAndSite(id: string, siteId: string) {
    return db.mediaFolder.findFirst({
        where: { id, siteId }
    });
}

/**
 * Mencari folder media beserta jumlah isinya (items & children).
 */
export async function findMediaFolderWithCounts(id: string) {
    return db.mediaFolder.findUnique({
        where: { id },
        include: { _count: { select: { items: true, children: true } } }
    });
}

/**
 * Menghapus folder media.
 */
export async function deleteMediaFolder(id: string) {
    return db.mediaFolder.delete({
        where: { id }
    });
}

/**
 * Mencari artikel/post berdasarkan query teks (judul atau slug).
 */
export async function searchPosts(siteId: string, q: string, limit = 5) {
    return db.post.findMany({
        where: {
            siteId,
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
            ]
        },
        take: limit,
        select: { id: true, title: true }
    });
}

/**
 * Mencari halaman (pages) berdasarkan query teks (judul atau path).
 */
export async function searchPages(siteId: string, q: string, limit = 5) {
    return db.credBuildPage.findMany({
        where: {
            siteId,
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { path: { contains: q, mode: 'insensitive' } },
            ]
        },
        take: limit,
        select: { id: true, title: true, path: true }
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

