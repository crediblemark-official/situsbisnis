import { createCrudHandler } from "@/lib/api/crud-handler";
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

const handler = createCrudHandler(galleryConfig);

export const GET = handler.collection.GET;
export const POST = handler.collection.POST;
