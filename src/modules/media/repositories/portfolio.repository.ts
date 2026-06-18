import { db } from "@/modules/shared/core/db";

export async function countPortfolioItems(siteId: string): Promise<number> {
    return db.portfolioItem.count({ where: { siteId } });
}

export async function findPortfolioItems(
    siteId: string,
    pagination: { skip: number; take: number },
    listSelect?: any
) {
    return db.portfolioItem.findMany({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        ...(listSelect ? { select: listSelect } : {})
    });
}

export async function findPortfolioItemById(id: string, siteId: string) {
    return db.portfolioItem.findFirst({
        where: { id, siteId }
    });
}

export async function createPortfolioItem(data: any, siteId: string) {
    return db.portfolioItem.create({
        data: {
            ...data,
            site: { connect: { id: siteId } }
        }
    });
}

export async function updatePortfolioItem(id: string, siteId: string, data: any) {
    const existing = await db.portfolioItem.findFirst({ where: { id, siteId } });
    if (!existing) return null;
    return db.portfolioItem.update({
        where: { id },
        data
    });
}

export async function deletePortfolioItem(id: string, siteId: string) {
    const existing = await db.portfolioItem.findFirst({ where: { id, siteId } });
    if (!existing) return null;
    return db.portfolioItem.delete({ where: { id } });
}
