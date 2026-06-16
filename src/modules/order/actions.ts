import { db } from "@/modules/shared/core/db";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrdersInternal(siteId: string): Promise<number> {
    return db.order.count({
        where: { siteId }
    });
}
