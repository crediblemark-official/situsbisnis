import { 
    countOrdersInternal,
    getRecentOrdersInternal,
    getOrderByIdInternal,
    getPaymentSettingsInternal,
    processOrderPaymentCallbackInternal,
    createOrderInternal,
    checkOrderStatusInternal,
    initializeOrderPaymentInternal,
    getOrderPaymentMethodsInternal,
    processOrderWebhookInternal,
    getOrderDetailInternal,
    updateOrderFulfillmentInternal,
    getOrdersInternal
} from "./controllers/order.controller";

// Facade / Client kontrak publik
export const OrderClient = {
    countOrders: countOrdersInternal,
    getRecentOrders: getRecentOrdersInternal,
    getOrderById: getOrderByIdInternal,
    getPaymentSettings: getPaymentSettingsInternal,
    processOrderPaymentCallback: processOrderPaymentCallbackInternal,
    createOrder: createOrderInternal,
    checkOrderStatus: checkOrderStatusInternal,
    initializeOrderPayment: initializeOrderPaymentInternal,
    getOrderPaymentMethods: getOrderPaymentMethodsInternal,
    processOrderWebhook: processOrderWebhookInternal,
    getOrderDetail: getOrderDetailInternal,
    updateOrderFulfillment: updateOrderFulfillmentInternal,
    getOrders: getOrdersInternal
};

