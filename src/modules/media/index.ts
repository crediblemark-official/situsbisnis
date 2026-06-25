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
    getGalleryItems,
    listGalleryItems,
    createGalleryItem,
    getGalleryItemDetail,
    updateGalleryItem,
    deleteGalleryItem
} from "./services/gallery.service";
import {
    getPortfolios,
    listPortfolioItems,
    createPortfolioItem,
    getPortfolioItemDetail,
    updatePortfolioItem,
    deletePortfolioItem
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
    listGalleryItems,
    createGalleryItem,
    getGalleryItemDetail,
    updateGalleryItem,
    deleteGalleryItem,
    getPortfolios,
    listPortfolioItems,
    createPortfolioItem,
    getPortfolioItemDetail,
    updatePortfolioItem,
    deletePortfolioItem
};

export { deleteMediaByUrl } from "./services/media.service";
