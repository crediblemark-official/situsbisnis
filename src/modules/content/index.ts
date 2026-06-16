import { 
    countPostsInternal, 
    countTestimonialsInternal, 
    getMediaSizeInternal 
} from "./actions";

// Facade / Client kontrak publik
export const ContentClient = {
    countPosts: countPostsInternal,
    countTestimonials: countTestimonialsInternal,
    getMediaSize: getMediaSizeInternal
};
