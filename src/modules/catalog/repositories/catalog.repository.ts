import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah produk aktif di suatu situs.
 */
export async function countProducts(siteId: string): Promise<number> {
    return db.product.count({
        where: { siteId, isArchived: false }
    });
}

/**
 * Mengambil informasi produk berdasarkan daftar productId.
 */
export async function findProductsByIds(productIds: string[]) {
    return db.product.findMany({
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
}
