import { CrudClient } from "@/modules/crud";
import { z } from "zod";

export const testimonialSchema = z.object({
    id: z.string().optional(),
    quote: z.string().min(1, "Quote is required"),
    author: z.string().min(1, "Author is required"),
    role: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    isApproved: z.boolean().optional(),
    avatarUrl: z.string().optional(),
});

export const testimonialConfig = {
    model: "testimonial" as const,
    schema: testimonialSchema,
    limitCheckType: "maxTestimonials",
    isPublicGet: true,
    transformData: (data: any, session: any) => {
        const isAdmin = session?.user?.role === "admin" || session?.user?.role === "editor";
        return {
            ...data,
            isApproved: data.isApproved !== undefined ? data.isApproved : isAdmin,
        };
    }
};

const handler = CrudClient.createHandler(testimonialConfig);

export const testimonialApi = {
    GET: handler.collection.GET,
    POST: handler.collection.POST,
    GET_DETAIL: handler.detail.GET,
    PATCH: handler.detail.PATCH,
    PUT: handler.detail.PUT,
    DELETE: handler.detail.DELETE,
};