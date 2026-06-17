import * as orderRepo from "../repositories/order.repository";
import { eventBus } from "@/modules/shared/core/event-bus";

/**
 * Menghitung jumlah pesanan di suatu situs.
 */
export async function countOrders(siteId: string): Promise<number> {
    return orderRepo.countOrders(siteId);
}

/**
 * Mengambil pesanan terbaru untuk suatu situs.
 */
export async function getRecentOrders(siteId: string, limit: number) {
    return orderRepo.findRecentOrders(siteId, limit);
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

/**
 * Mengambil detail pesanan yang dihias dengan data produk.
 */
export async function getOrderDetail(orderId: string, siteId: string) {
    if (!orderId) throw new Error("Order ID required");

    const order = await orderRepo.findOrderFirst(orderId, siteId);
    if (!order) {
        throw new Error("Order not found");
    }

    const productIds = order.items.map(item => item.productId);
    const productsMap = await eventBus.request<any, Record<string, any>>("request.catalog.getProductsMap", { productIds });

    const decoratedItems = order.items.map(item => ({
        ...item,
        product: productsMap[item.productId] || null
    }));

    return {
        ...order,
        items: decoratedItems
    };
}

/**
 * Memperbarui status pesanan oleh owner/admin.
 */
export async function updateOrderFulfillment(
    orderId: string,
    siteId: string,
    body: { paymentStatus?: string; fulfillmentStatus?: string; status?: string }
) {
    const order = await orderRepo.findOrderFirst(orderId, siteId);
    if (!order) {
        throw new Error("Order not found");
    }

    const updateData: any = {};
    if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
    if (body.fulfillmentStatus) updateData.fulfillmentStatus = body.fulfillmentStatus;
    if (body.status) updateData.status = body.status;

    const updated = await orderRepo.updateOrderFulfillment(orderId, updateData);
    return { success: true, order: updated };
}

/**
 * Mengambil daftar pesanan dengan filter dan pagination.
 */
export async function getOrders(siteId: string, options: { skip: number; take: number; customerEmail?: string }) {
    const whereCondition: any = { siteId };
    if (options.customerEmail) {
        whereCondition.customerEmail = options.customerEmail;
    }

    const safeSkip = Math.max(0, options.skip);
    const safeTake = Math.min(Math.max(1, options.take), 100);

    const [orders, total] = await Promise.all([
        orderRepo.findOrders(whereCondition, safeSkip, safeTake),
        orderRepo.countOrdersWithFilter(whereCondition)
    ]);

    return { orders, total };
}
