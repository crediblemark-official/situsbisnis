import {
    countPosts,
    countTestimonials
} from "./services/content.service";
import {
    getTerms,
    createTerm,
    deleteTerm,
    updateTerm
} from "./services/taxonomy.service";
import {
    searchAll
} from "./services/search.service";
import {
    getPost,
    getPosts
} from "./services/post.service";
import {
    getTestimonials
} from "./services/testimonial.service";

export const PostClient = {
    countPosts,
    countTestimonials,
    getTerms,
    createTerm,
    deleteTerm,
    updateTerm,
    searchAll,
    getPost,
    getPosts,
    getTestimonials
};
