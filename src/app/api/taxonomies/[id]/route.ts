import { createCrudHandler } from "@/lib/api/crud-handler";
import { z } from "zod";

const taxonomySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
});

const handler = createCrudHandler({
    model: "taxonomy",
    schema: taxonomySchema
});

export const GET = handler.detail.GET;
export const PUT = handler.detail.PUT;
export const DELETE = handler.detail.DELETE;
export const PATCH = handler.detail.PATCH;
