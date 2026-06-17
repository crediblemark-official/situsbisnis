import {
    getPages,
    getPageDetail,
    savePage,
    deletePage,
    getCredBuildPage,
    saveCredBuildPage,
    getPage
} from "./services/page.service";
import {
    getMenu,
    updateMenu
} from "./services/menu.service";
import {
    getPost,
    getPosts,
    getPage as getCachedPage,
    getGalleryItems,
    getPortfolios,
    getTestimonials,
    getProducts,
    getProduct
} from "./ui/content-display";

export * from "./actions/page.actions";

export const PageClient = {
    getPages,
    getPageDetail,
    savePage,
    deletePage,
    getCredBuildPage,
    saveCredBuildPage,
    getPage,
    getMenu,
    updateMenu,
    getPost,
    getPosts,
    getCachedPage,
    getGalleryItems,
    getPortfolios,
    getTestimonials,
    getProducts,
    getProduct
};
