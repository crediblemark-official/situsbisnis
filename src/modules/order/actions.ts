import * as orderService from "./services/order.service";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrdersInternal(siteId: string): Promise<number> {
    return orderService.countOrders(siteId);
}

/**
 * Mendapatkan data pesanan berdasarkan ID.
 */
export async function getOrderByIdInternal(orderId: string) {
    return orderService.getOrderById(orderId);
}

/**
 * Mendapatkan pengaturan pembayaran situs.
 */
export async function getPaymentSettingsInternal(siteId: string) {
    return orderService.getPaymentSettings(siteId);
}

/**
 * Memproses callback pembayaran pesanan dari Duitku.
 */
export async function processOrderPaymentCallbackInternal(orderId: string, siteId: string, amount: number, creditOwner: boolean) {
    return orderService.processOrderPaymentCallback(orderId, siteId, amount, creditOwner);
}
