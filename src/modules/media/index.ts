import {
    countMediaItemsInternal,
    countGalleryItemsInternal,
    countPortfolioItemsInternal,
    getMediaSizeInternal,
    getMediaListInternal,
    uploadMediaInternal,
    deleteMediaInternal,
    getMediaFoldersInternal,
    createMediaFolderInternal,
    deleteMediaFolderInternal,
    getGalleryItemsInternal,
    getPortfoliosInternal
} from "./controllers/media.controller";

export const MediaClient = {
    countMediaItems: countMediaItemsInternal,
    countGalleryItems: countGalleryItemsInternal,
    countPortfolioItems: countPortfolioItemsInternal,
    getMediaSize: getMediaSizeInternal,
    getMediaList: getMediaListInternal,
    uploadMedia: uploadMediaInternal,
    deleteMedia: deleteMediaInternal,
    getMediaFolders: getMediaFoldersInternal,
    createMediaFolder: createMediaFolderInternal,
    deleteMediaFolder: deleteMediaFolderInternal,
    getGalleryItems: getGalleryItemsInternal,
    getPortfolios: getPortfoliosInternal
};
