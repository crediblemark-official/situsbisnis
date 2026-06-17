import { CrudClient } from "@/modules/crud";
import { z } from "zod";

export const postSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
    content: z.any().optional().default({}),
    status: z.string().optional().default("draft"),
    imageUrl: z.string().optional(),
    postId: z.string().optional(),
    excerpt: z.string().optional().nullable(),
    metaData: z.array(z.any()).optional(),
});

export const postConfig = {
    model: "post" as const,
    schema: postSchema,
    idField: "postId",
    limitCheckType: "maxPosts",
    isPublicGet: true,
    listSelect: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
    },
    transformData: (data: any, session: any) => {
        const { status, ...rest } = data;
        return {
            ...rest,
            published: status === "published",
            authorId: session?.user?.id
        };
    }
};

const handler = CrudClient.createHandler(postConfig);

export const postApi = {
    GET: handler.collection.GET,
    POST: handler.collection.POST,
    GET_DETAIL: handler.detail.GET,
    PATCH: handler.detail.PATCH,
    PUT: handler.detail.PUT,
    DELETE: handler.detail.DELETE,
};
