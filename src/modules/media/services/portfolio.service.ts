import { z } from "zod";
import * as contentRepo from "../repositories/content.repository";
import * as portfolioRepo from "../repositories/portfolio.repository";
import { buildPagination, fetchWithCache, publishCrudEvent } from "@/modules/shared/core/crud-base";
import { AppError } from "@/modules/shared/utils/api/errors";

export const portfolioItemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    imageUrl: z.string().min(1, "Image URL is required"),
    link: z.string().optional().or(z.literal("")),
    description: z.string().optional(),
    id: z.string().optional(),
});

const listSelect = {
    id: true,
    title: true,
    category: true,
    imageUrl: true,
    link: true,
    description: true,
    createdAt: true
};

export async function getPortfolios(siteId: string) {
    return contentRepo.findPortfolioItems(siteId);
}

export async function listPortfolioItems(siteId: string, searchParams: URLSearchParams) {
    const pagination = buildPagination(searchParams);
    const cacheKey = `portfolio-list-${siteId}-${pagination.page}-${pagination.limit}`;

    return fetchWithCache(
        cacheKey,
        async () => {
            const [data, total] = await Promise.all([
                portfolioRepo.findPortfolioItems(siteId, { skip: pagination.skip, take: pagination.limit }, listSelect),
                portfolioRepo.countPortfolioItems(siteId)
            ]);
            return {
                data,
                pagination: {
                    total,
                    page: pagination.page,
                    limit: pagination.limit,
                    totalPages: Math.ceil(total / pagination.limit)
                }
            };
        },
        [`site-${siteId}`, `site-${siteId}-portfolioItem`],
        300
    );
}

export async function createPortfolioItem(siteId: string, data: any) {
    const parsed = portfolioItemSchema.parse(data);
    const { id: _id, ...createData } = parsed;
    const item = await portfolioRepo.createPortfolioItem(createData, siteId);
    await publishCrudEvent("crud.created", "portfolioItem", siteId, item);
    return item;
}

export async function getPortfolioItemDetail(id: string, siteId: string) {
    const item = await portfolioRepo.findPortfolioItemById(id, siteId);
    if (!item) throw new AppError("Item not found", 404);
    return item;
}

export async function updatePortfolioItem(id: string, siteId: string, data: any) {
    const existing = await portfolioRepo.findPortfolioItemById(id, siteId);
    if (!existing) throw new AppError("Item not found", 404);

    const parsed = portfolioItemSchema.parse(data);
    const { id: _id, ...updateData } = parsed;
    const item = await portfolioRepo.updatePortfolioItem(id, siteId, updateData);
    await publishCrudEvent("crud.updated", "portfolioItem", siteId, item);
    return item;
}

export async function deletePortfolioItem(id: string, siteId: string) {
    const existing = await portfolioRepo.findPortfolioItemById(id, siteId);
    if (!existing) throw new AppError("Item not found", 404);

    await portfolioRepo.deletePortfolioItem(id, siteId);
    await publishCrudEvent("crud.deleted", "portfolioItem", siteId, existing);
    return { success: true };
}
