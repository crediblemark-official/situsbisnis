import { db } from "@/lib/core/db";

export interface SiteOwnerInfo {
    id: string;
    email: string | null;
    name: string | null;
    referredById: string | null;
}

export interface AwardCommissionDTO {
    userId: string;
    amount: number;
    transactionId: string;
    description: string;
}

export const IdentityClient = {
    /**
     * Mengambil data pemilik situs berdasarkan siteId.
     */
    async getSiteOwner(siteId: string): Promise<SiteOwnerInfo | null> {
        // Cari user yang terhubung ke siteId
        const user = await db.user.findFirst({
            where: {
                sites: {
                    some: { id: siteId }
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                referredById: true
            }
        });
        return user;
    },

    /**
     * Mengalokasikan komisi afiliasi kepada referrer user.
     * Menerima dbClient (PrismaTransaction client) untuk berpartisipasi dalam transaksi yang sama.
     */
    async awardAffiliateCommission(
        dbClient: any, 
        data: AwardCommissionDTO
    ): Promise<void> {
        const client = dbClient || db;
        
        await client.commission.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                transactionId: data.transactionId,
                description: data.description
            }
        });

        await client.user.update({
            where: { id: data.userId },
            data: {
                affiliateBalance: {
                    increment: data.amount
                }
            }
        });
    }
};
