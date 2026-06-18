import {
    countPosts,
    countTestimonials
} from "./services/content.service";
import {
    getTerms,
    createTerm,
    deleteTerm,
    updateTerm,
    listTaxonomies,
    createTaxonomy,
    getTaxonomyDetail,
    updateTaxonomy,
    deleteTaxonomy,
    archiveTaxonomy
} from "./services/taxonomy.service";
import {
    searchAll
} from "./services/search.service";
import {
    getPost,
    getPosts,
    listPosts,
    createPost,
    getPostDetail,
    updatePost,
    deletePost,
    archivePost
} from "./services/post.service";
import {
    getTestimonial,
    getTestimonials,
    listTestimonials,
    createTestimonial,
    getTestimonialDetail,
    updateTestimonial,
    deleteTestimonial,
    archiveTestimonial
} from "./services/testimonial.service";

export const PostClient = {
    countPosts,
    countTestimonials,
    getTerms,
    createTerm,
    deleteTerm,
    updateTerm,
    listTaxonomies,
    createTaxonomy,
    getTaxonomyDetail,
    updateTaxonomy,
    deleteTaxonomy,
    archiveTaxonomy,
    searchAll,
    getPost,
    getPosts,
    listPosts,
    createPost,
    getPostDetail,
    updatePost,
    deletePost,
    archivePost,
    getTestimonial,
    getTestimonials,
    listTestimonials,
    createTestimonial,
    getTestimonialDetail,
    updateTestimonial,
    deleteTestimonial,
    archiveTestimonial
};
