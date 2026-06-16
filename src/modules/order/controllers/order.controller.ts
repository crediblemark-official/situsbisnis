import * as orderService from "../services/order.service";
import * as checkoutService from "../services/checkout.service";
import * as webhookService from "../services/webhook.service";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrdersInternal(siteId: string): Promise<number> {
    return orderService.countOrders(siteId);
}

export async function getRecentOrdersInternal(siteId: string, limit: number) {
    return orderService.getRecentOrders(siteId, limit);
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

export async function createOrderInternal(
    siteId: string,
    items: Array<{ productId: string; quantity: number }>,
    customerDetails: any,
    sessionCustomer?: any
) {
    return checkoutService.createOrder(siteId, items, customerDetails, sessionCustomer);
}

export async function checkOrderStatusInternal(orderId: string) {
    return webhookService.checkOrderStatus(orderId);
}

export async function initializeOrderPaymentInternal(orderId: string, paymentMethod: string, origin: string) {
    return checkoutService.initializeOrderPayment(orderId, paymentMethod, origin);
}

export async function getOrderPaymentMethodsInternal(orderId: string) {
    return checkoutService.getOrderPaymentMethods(orderId);
}

export async function processOrderWebhookInternal(body: Record<string, any>) {
    return webhookService.processOrderWebhook(body);
}

export async function getOrderDetailInternal(orderId: string, siteId: string) {
    return orderService.getOrderDetail(orderId, siteId);
}

export async function updateOrderFulfillmentInternal(orderId: string, siteId: string, body: any) {
    return orderService.updateOrderFulfillment(orderId, siteId, body);
}

export async function getOrdersInternal(siteId: string, options: { skip: number; take: number; customerEmail?: string }) {
    return orderService.getOrders(siteId, options);
}
