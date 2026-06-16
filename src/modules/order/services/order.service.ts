import * as orderRepo from "../repositories/order.repository";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrders(siteId: string): Promise<number> {
    return orderRepo.countOrders(siteId);
}

/**
 * Mendapatkan data pesanan berdasarkan ID.
 */
export async function getOrderById(orderId: string) {
    return orderRepo.findOrderById(orderId);
}

/**
 * Mendapatkan pengaturan pembayaran situs.
 */
export async function getPaymentSettings(siteId: string) {
    return orderRepo.findPaymentSettings(siteId);
}

/**
 * Memproses callback pembayaran pesanan dari Duitku.
 */
export async function processOrderPaymentCallback(orderId: string, siteId: string, amount: number, creditOwner: boolean) {
    return orderRepo.processOrderPayment(orderId, siteId, amount, creditOwner);
}
