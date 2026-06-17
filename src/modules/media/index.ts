import {
    countMediaItems,
    countGalleryItems,
    countPortfolioItems,
    getMediaSize
} from "./services/content.service";
import {
    getMediaList,
    uploadMedia,
    deleteMedia,
    getMediaFolders,
    createMediaFolder,
    deleteMediaFolder
} from "./services/media.service";
import {
    getGalleryItems
} from "./services/gallery.service";
import {
    getPortfolios
} from "./services/portfolio.service";

export const MediaClient = {
    countMediaItems,
    countGalleryItems,
    countPortfolioItems,
    getMediaSize,
    getMediaList,
    uploadMedia,
    deleteMedia,
    getMediaFolders,
    createMediaFolder,
    deleteMediaFolder,
    getGalleryItems,
    getPortfolios
};
