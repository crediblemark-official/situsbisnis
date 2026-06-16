import { createCrudHandler } from "@/lib/api/crud-handler";
import { z } from "zod";

export const productSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
    description: z.string().optional(),
    price: z.coerce.number().positive("Price must be a positive number"),
    originalPrice: z.coerce.number().positive("Price must be a positive number").optional().nullable(),
    stock: z.coerce.number().int().nonnegative("Stock cannot be negative").optional().default(0),
    images: z.array(z.string()).optional().default([]),
    productId: z.string().optional(),
    variants: z.any().optional(),
    variantOptions: z.any().optional(),
    metaData: z.array(
        z.object({
            key: z.string(),
            value: z.string().optional().nullable(),
            type: z.string().optional().default("text")
        })
    ).optional(),
});

export const productConfig = {
    model: "product" as const,
    schema: productSchema,
    idField: "productId",
    limitCheckType: "maxProducts",
    includeArchivedLogic: true,
    isPublicGet: true,
    listSelect: {
        id: true,
        name: true,
        slug: true,
        price: true,
        originalPrice: true,
        currency: true,
        stock: true,
        isArchived: true,
        createdAt: true,
        images: true,
        terms: {
            select: {
                id: true,
                name: true,
                slug: true,
                taxonomyId: true,
            }
        }
    },
};

const handler = createCrudHandler(productConfig);

export const GET = handler.collection.GET;
export const POST = handler.collection.POST;
