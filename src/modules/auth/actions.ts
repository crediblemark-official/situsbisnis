import { db } from "@/modules/shared/core/db";
import { SiteOwnerInfo, AwardCommissionDTO, UserDTO } from "./index";

/**
 * Mengambil data pemilik situs berdasarkan siteId.
 */
export async function getSiteOwnerInternal(siteId: string): Promise<SiteOwnerInfo | null> {
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
}

/**
 * Mengambil data dasar user berdasarkan ID.
 */
export async function getUserByIdInternal(userId: string): Promise<UserDTO | null> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });
    return user as UserDTO | null;
}

/**
 * Mengambil peta informasi user berdasarkan daftar userId.
 */
export async function getUsersMapInternal(userIds: string[]): Promise<Record<string, UserDTO>> {
    if (userIds.length === 0) return {};

    const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });

    const resultMap: Record<string, UserDTO> = {};
    users.forEach(u => {
        resultMap[u.id] = u as UserDTO;
    });

    return resultMap;
}

/**
 * Mengalokasikan komisi afiliasi kepada referrer user.
 */
export async function awardAffiliateCommissionInternal(
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
