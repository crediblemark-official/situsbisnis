import { CrudClient } from "@/modules/crud";
import { z } from "zod";

export const galleryItemSchema = z.object({
    title: z.string().optional(),
    url: z.string().url("Invalid image URL"),
    description: z.string().optional(),
    id: z.string().optional(),
});

export const galleryConfig = {
    model: "galleryItem" as const,
    schema: galleryItemSchema,
    isPublicGet: true,
};

const handler = CrudClient.createHandler(galleryConfig);

export const galleryApi = {
    GET: handler.collection.GET,
    POST: handler.collection.POST,
    GET_DETAIL: handler.detail.GET,
    PATCH: handler.detail.PATCH,
    PUT: handler.detail.PUT,
    DELETE: handler.detail.DELETE,
};