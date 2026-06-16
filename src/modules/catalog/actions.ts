import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah produk aktif di suatu situs.
 */
export async function countProductsInternal(siteId: string): Promise<number> {
    return db.product.count({
        where: { siteId, isArchived: false }
    });
}
