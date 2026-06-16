import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah produk aktif di suatu situs.
 */
export async function countProductsInternal(siteId: string): Promise<number> {
    return db.product.count({
        where: { siteId, isArchived: false }
    });
}

/**
 * Mengambil peta informasi produk berdasarkan daftar productId.
 */
export async function getProductsMapInternal(productIds: string[]): Promise<Record<string, any>> {
    if (productIds.length === 0) return {};

    const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            name: true,
            images: true,
            price: true,
            currency: true,
            metaData: {
                select: {
                    key: true,
                    value: true
                }
            }
        }
    });

    const resultMap: Record<string, any> = {};
    products.forEach(p => {
        resultMap[p.id] = p;
    });

    return resultMap;
}
