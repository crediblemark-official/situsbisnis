import { CrudClient } from "@/modules/crud";
import { z } from "zod";

const taxonomySchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
});

const handler = CrudClient.createHandler({
    model: "taxonomy",
    schema: taxonomySchema
});

export const taxonomyApi = {
    GET: handler.collection.GET,
    POST: handler.collection.POST,
    GET_DETAIL: handler.detail.GET,
    PATCH: handler.detail.PATCH,
    PUT: handler.detail.PUT,
    DELETE: handler.detail.DELETE,
};