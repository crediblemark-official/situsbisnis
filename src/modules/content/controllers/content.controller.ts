import * as contentService from "../services/content.service";
import * as mediaService from "../services/media.service";
import * as searchService from "../services/search.service";
import * as pageService from "../services/page.service";
import * as taxonomyService from "../services/taxonomy.service";
import * as postService from "../services/post.service";
import * as galleryService from "../services/gallery.service";
import * as portfolioService from "../services/portfolio.service";
import * as testimonialService from "../services/testimonial.service";

/**
 * Menghitung jumlah artikel/post di suatu situs.
 */
export async function countPostsInternal(siteId: string): Promise<number> {
    return contentService.countPosts(siteId);
}

/**
 * Menghitung jumlah testimoni di suatu situs.
 */
export async function countTestimonialsInternal(siteId: string): Promise<number> {
    return contentService.countTestimonials(siteId);
}

export async function countMediaItemsInternal(siteId: string): Promise<number> {
    return contentService.countMediaItems(siteId);
}

export async function countGalleryItemsInternal(siteId: string): Promise<number> {
    return contentService.countGalleryItems(siteId);
}

export async function countPortfolioItemsInternal(siteId: string): Promise<number> {
    return contentService.countPortfolioItems(siteId);
}

/**
 * Mengambil total ukuran media storage yang digunakan di suatu situs (dalam byte).
 */
export async function getMediaSizeInternal(siteId: string): Promise<number> {
    return contentService.getMediaSize(siteId);
}

/**
 * Mengambil daftar halaman untuk suatu situs.
 */
export async function getPagesInternal(siteId: string) {
    return pageService.getPages(siteId);
}

/**
 * Mengambil data detail halaman berdasarkan ID.
 */
export async function getPageDetailInternal(id: string, siteId: string) {
    return pageService.getPageDetail(id, siteId);
}

/**
 * Menyimpan data halaman (upsert) beserta metadata.
 */
export async function savePageInternal(siteId: string, body: any) {
    return pageService.savePage(siteId, body);
}

/**
 * Menghapus halaman.
 */
export async function deletePageInternal(id: string, siteId: string) {
    return pageService.deletePage(id, siteId);
}

/**
 * Mengambil terms berdasarkan taxonomyId.
 */
export async function getTermsInternal(taxonomyId: string, siteId: string) {
    return taxonomyService.getTerms(taxonomyId, siteId);
}

/**
 * Membuat term baru di taksonomi.
 */
export async function createTermInternal(taxonomyId: string, siteId: string, data: any) {
    return taxonomyService.createTerm(taxonomyId, siteId, data);
}

/**
 * Menghapus term.
 */
export async function deleteTermInternal(termId: string, siteId: string) {
    return taxonomyService.deleteTerm(termId, siteId);
}

/**
 * Memperbarui data term.
 */
export async function updateTermInternal(termId: string, siteId: string, data: any) {
    return taxonomyService.updateTerm(termId, siteId, data);
}

// Media & Folders Actions
export async function getMediaListInternal(siteId: string, folderId: string | null, page: number, limit: number) {
    return mediaService.getMediaList(siteId, folderId, page, limit);
}

export async function uploadMediaInternal(siteId: string, file: File, folderId: string | null) {
    return mediaService.uploadMedia(siteId, file, folderId);
}

export async function deleteMediaInternal(siteId: string, id: string) {
    return mediaService.deleteMedia(siteId, id);
}

export async function getMediaFoldersInternal(siteId: string, parentId: string | null) {
    return mediaService.getMediaFolders(siteId, parentId);
}

export async function createMediaFolderInternal(siteId: string, name: string, parentId: string | null) {
    return mediaService.createMediaFolder(siteId, name, parentId);
}

export async function deleteMediaFolderInternal(siteId: string, id: string) {
    return mediaService.deleteMediaFolder(siteId, id);
}

export async function searchAllInternal(siteId: string, q: string) {
    return searchService.searchAll(siteId, q);
}

export async function getCredBuildPageInternal(siteId: string, path: string) {
    return pageService.getCredBuildPage(siteId, path);
}

export async function saveCredBuildPageInternal(siteId: string, path: string, data: any) {
    return pageService.saveCredBuildPage(siteId, path, data);
}

/**
 * Mengambil detail artikel berdasarkan slug di suatu situs.
 */
export async function getPostInternal(slug: string, siteId: string) {
    return postService.getPost(slug, siteId);
}

/**
 * Mengambil daftar artikel aktif di suatu situs.
 */
export async function getPostsInternal(siteId: string) {
    return postService.getPosts(siteId);
}

/**
 * Mengambil detail halaman berdasarkan path di suatu situs.
 */
export async function getPageInternal(path: string, siteId: string) {
    return pageService.getPage(path, siteId);
}

/**
 * Mengambil daftar media galeri di suatu situs.
 */
export async function getGalleryItemsInternal(siteId: string) {
    return galleryService.getGalleryItems(siteId);
}

/**
 * Mengambil daftar item portofolio di suatu situs.
 */
export async function getPortfoliosInternal(siteId: string) {
    return portfolioService.getPortfolios(siteId);
}

/**
 * Mengambil daftar testimoni yang disetujui di suatu situs.
 */
export async function getTestimonialsInternal(siteId: string) {
    return testimonialService.getTestimonials(siteId);
}
