import { createCrudHandler } from "@/lib/api/crud-handler";
import { z } from "zod";
import { Role } from "@prisma/client";

export const portfolioItemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    imageUrl: z.string().min(1, "Image URL is required"),
    link: z.string().optional().or(z.literal("")),
    description: z.string().optional(),
    id: z.string().optional(),
});

export const portfolioConfig = {
    model: "portfolioItem" as const,
    schema: portfolioItemSchema,
    roles: ["admin", "editor", "owner"] as Role[],
    isPublicGet: true,
};

const handler = createCrudHandler(portfolioConfig);

export const GET = handler.collection.GET;
export const POST = handler.collection.POST;
