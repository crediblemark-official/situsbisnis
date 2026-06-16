import { createCrudHandler } from "@/lib/api/crud-handler";
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

export const dynamic = 'force-dynamic';

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

const handler = createCrudHandler(testimonialConfig);

export const GET = handler.collection.GET;
export const POST = handler.collection.POST;
