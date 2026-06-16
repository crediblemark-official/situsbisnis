import { db } from "@/lib/core/db";

export const OrderClient = {
    /**
     * Menghitung jumlah pesanan di suatu situs.
     */
    async countOrders(siteId: string): Promise<number> {
        return db.order.count({
            where: { siteId }
        });
    }
};
