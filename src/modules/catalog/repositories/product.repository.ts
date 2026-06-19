import { db } from "@/modules/shared/core/db";
import { Prisma } from "@prisma/client";

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export async function countProducts(siteId: string, where?: Prisma.ProductWhereInput): Promise<number> {
    return db.product.count({
        where: { siteId, ...where }
    });
}

export async function findProducts(
    siteId: string,
    pagination: PaginationParams,
    where?: Prisma.ProductWhereInput,
    select?: Prisma.ProductSelect
) {
    return db.product.findMany({
        where: { siteId, ...where },
        orderBy: { createdAt: 'desc' },
        take: pagination.limit,
        skip: pagination.skip,
        ...(select ? { select } : {})
    });
}

export async function findProductById(id: string, siteId: string) {
    const product = await db.product.findFirst({
        where: { id, siteId }
    });
    if (!product) return null;
    const metaData = await db.metaData.findMany({ where: { productId: product.id } });
    return { ...product, metaData };
}

export async function createProduct(data: Prisma.ProductUncheckedCreateInput, siteId: string) {
    return db.product.create({
        data: {
            ...data,
            siteId,
        }
    });
}

export async function updateProduct(id: string, siteId: string, data: Prisma.ProductUncheckedUpdateInput) {
    return db.product.update({
        where: { id },
        data
    });
}

export async function deleteProduct(id: string) {
    await db.metaData.deleteMany({ where: { productId: id } });
    await db.product.delete({ where: { id } });
}
