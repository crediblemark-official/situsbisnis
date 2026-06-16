import { PostClient } from "@/modules/post";
import * as contentService from "../services/content.service";
import { MediaClient } from "@/modules/media";

import * as pageService from "../services/page.service";






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
    return PostClient.getTerms(taxonomyId, siteId);
}

/**
 * Membuat term baru di taksonomi.
 */
export async function createTermInternal(taxonomyId: string, siteId: string, data: any) {
    return PostClient.createTerm(taxonomyId, siteId, data);
}

/**
 * Menghapus term.
 */
export async function deleteTermInternal(termId: string, siteId: string) {
    return PostClient.deleteTerm(termId, siteId);
}

/**
 * Memperbarui data term.
 */
export async function updateTermInternal(termId: string, siteId: string, data: any) {
    return PostClient.updateTerm(termId, siteId, data);
}

// Media & Folders Actions
export async function getMediaListInternal(siteId: string, folderId: string | null, page: number, limit: number) {
    return MediaClient.getMediaList(siteId, folderId, page, limit);
}

export async function uploadMediaInternal(siteId: string, file: File, folderId: string | null) {
    return MediaClient.uploadMedia(siteId, file, folderId);
}

export async function deleteMediaInternal(siteId: string, id: string) {
    return MediaClient.deleteMedia(siteId, id);
}

export async function getMediaFoldersInternal(siteId: string, parentId: string | null) {
    return MediaClient.getMediaFolders(siteId, parentId);
}

export async function createMediaFolderInternal(siteId: string, name: string, parentId: string | null) {
    return MediaClient.createMediaFolder(siteId, name, parentId);
}

export async function deleteMediaFolderInternal(siteId: string, id: string) {
    return MediaClient.deleteMediaFolder(siteId, id);
}

export async function searchAllInternal(siteId: string, q: string) {
    return PostClient.searchAll(siteId, q);
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
    return PostClient.getPost(slug, siteId);
}

/**
 * Mengambil daftar artikel aktif di suatu situs.
 */
export async function getPostsInternal(siteId: string) {
    return PostClient.getPosts(siteId);
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
    return MediaClient.getGalleryItems(siteId);
}

/**
 * Mengambil daftar item portofolio di suatu situs.
 */
export async function getPortfoliosInternal(siteId: string) {
    return MediaClient.getPortfolios(siteId);
}

/**
 * Mengambil daftar testimoni yang disetujui di suatu situs.
 */
export async function getTestimonialsInternal(siteId: string) {
    return PostClient.getTestimonials(siteId);
}
