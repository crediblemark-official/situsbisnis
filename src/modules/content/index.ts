import { 
    countPostsInternal, 
    countTestimonialsInternal, 
    getMediaSizeInternal,
    getPagesInternal,
    getPageDetailInternal,
    savePageInternal,
    deletePageInternal,
    getTermsInternal,
    createTermInternal,
    deleteTermInternal,
    updateTermInternal
} from "./actions";

// Facade / Client kontrak publik
export const ContentClient = {
    countPosts: countPostsInternal,
    countTestimonials: countTestimonialsInternal,
    getMediaSize: getMediaSizeInternal,
    getPages: getPagesInternal,
    getPageDetail: getPageDetailInternal,
    savePage: savePageInternal,
    deletePage: deletePageInternal,
    getTerms: getTermsInternal,
    createTerm: createTermInternal,
    deleteTerm: deleteTermInternal,
    updateTerm: updateTermInternal
};

