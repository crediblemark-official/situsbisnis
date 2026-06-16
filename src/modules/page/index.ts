import {
    getPagesInternal,
    getPageDetailInternal,
    savePageInternal,
    deletePageInternal,
    getCredBuildPageInternal,
    saveCredBuildPageInternal,
    getPageInternal,
} from "./controllers/content.controller";
import {
    getMenuInternal,
    updateMenuInternal
} from "./controllers/menu.controller";
import {
    getPost,
    getPosts,
    getPage,
    getGalleryItems,
    getPortfolios,
    getTestimonials,
    getProducts,
    getProduct
} from "./ui/content-display";

export const PageClient = {
    getPages: getPagesInternal,
    getPageDetail: getPageDetailInternal,
    savePage: savePageInternal,
    deletePage: deletePageInternal,
    getCredBuildPage: getCredBuildPageInternal,
    saveCredBuildPage: saveCredBuildPageInternal,
    getPage: getPageInternal,
    getMenu: getMenuInternal,
    updateMenu: updateMenuInternal,
    getPost,
    getPosts,
    getCachedPage: getPage,
    getGalleryItems,
    getPortfolios,
    getTestimonials,
    getProducts,
    getProduct
};
