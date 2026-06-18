import { 
    countOrders,
    getRecentOrders,
    getOrderById,
    getPaymentSettings,
    processOrderPaymentCallback,
    getOrderDetail,
    updateOrderFulfillment,
    getOrders
} from "./services/order.service";

import {
    createOrder,
    initializeOrderPayment,
    getOrderPaymentMethods
} from "./services/checkout.service";

import {
    checkOrderStatus,
    processOrderWebhook
} from "./services/webhook.service";

// Facade / Client kontrak publik
export const OrderClient = {
    countOrders,
    getRecentOrders,
    getOrderById,
    getPaymentSettings,
    processOrderPaymentCallback,
    createOrder,
    checkOrderStatus,
    initializeOrderPayment,
    getOrderPaymentMethods,
    processOrderWebhook,
    getOrderDetail,
    updateOrderFulfillment,
    getOrders
};

