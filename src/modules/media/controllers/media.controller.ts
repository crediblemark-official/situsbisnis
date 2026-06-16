import * as contentService from "../services/content.service";
import * as mediaService from "../services/media.service";
import * as galleryService from "../services/gallery.service";
import * as portfolioService from "../services/portfolio.service";

export async function countMediaItemsInternal(siteId: string): Promise<number> {
    return contentService.countMediaItems(siteId);
}

export async function countGalleryItemsInternal(siteId: string): Promise<number> {
    return contentService.countGalleryItems(siteId);
}

export async function countPortfolioItemsInternal(siteId: string): Promise<number> {
    return contentService.countPortfolioItems(siteId);
}

export async function getMediaSizeInternal(siteId: string): Promise<number> {
    return contentService.getMediaSize(siteId);
}

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

export async function getGalleryItemsInternal(siteId: string) {
    return galleryService.getGalleryItems(siteId);
}

export async function getPortfoliosInternal(siteId: string) {
    return portfolioService.getPortfolios(siteId);
}
