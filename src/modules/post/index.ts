import {
    countPostsInternal,
    countTestimonialsInternal,
    getTermsInternal,
    createTermInternal,
    deleteTermInternal,
    updateTermInternal,
    searchAllInternal,
    getPostInternal,
    getPostsInternal,
    getTestimonialsInternal
} from "./controllers/post.controller";

export const PostClient = {
    countPosts: countPostsInternal,
    countTestimonials: countTestimonialsInternal,
    getTerms: getTermsInternal,
    createTerm: createTermInternal,
    deleteTerm: deleteTermInternal,
    updateTerm: updateTermInternal,
    searchAll: searchAllInternal,
    getPost: getPostInternal,
    getPosts: getPostsInternal,
    getTestimonials: getTestimonialsInternal
};
