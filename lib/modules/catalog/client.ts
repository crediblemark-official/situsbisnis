import { db } from "@/lib/core/db";

export const CatalogClient = {
    /**
     * Menghitung jumlah produk aktif di suatu situs.
     */
    async countProducts(siteId: string): Promise<number> {
        return db.product.count({
            where: { siteId, isArchived: false }
        });
    }
};
