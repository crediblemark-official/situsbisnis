import { db } from "@/modules/shared/core/db";

/**
 * Menambahkan jumlah penggunaan kupon.
 */
export async function incrementCouponUses(tx, id: string) {
    const client = tx || db;
    return client.coupon.update({
        where: { id },
        data: { usedCount: { increment: 1 } }
    });
}

/**
 * Mencari kupon berdasarkan kode kupon.
 */
export async function findCouponByCode(code: string) {
    return db.coupon.findUnique({
        where: { code }
    });
}

/**
 * Mengambil seluruh data kupon yang terurut berdasarkan tanggal dibuat.
 */
export async function findAllCoupons() {
    return db.coupon.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
}

/**
 * Membuat kupon baru.
 */
export async function createCoupon(data: any) {
    return db.coupon.create({
        data
    });
}

/**
 * Mencari kupon berdasarkan ID.
 */
export async function findCouponById(id: string) {
    return db.coupon.findUnique({
        where: { id }
    });
}

/**
 * Memperbarui kupon.
 */
export async function updateCoupon(id: string, data: any) {
    return db.coupon.update({
        where: { id },
        data
    });
}

/**
 * Menghapus kupon.
 */
export async function deleteCoupon(id: string) {
    return db.coupon.delete({
        where: { id }
    });
}
