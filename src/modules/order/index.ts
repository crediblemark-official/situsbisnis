import { 
    countOrdersInternal,
    getOrderByIdInternal,
    getPaymentSettingsInternal,
    processOrderPaymentCallbackInternal,
    createOrderInternal,
    checkOrderStatusInternal,
    initializeOrderPaymentInternal,
    getOrderPaymentMethodsInternal,
    processOrderWebhookInternal,
    getOrderDetailInternal,
    updateOrderFulfillmentInternal
} from "./controllers/order.controller";

// Facade / Client kontrak publik
export const OrderClient = {
    countOrders: countOrdersInternal,
    getOrderById: getOrderByIdInternal,
    getPaymentSettings: getPaymentSettingsInternal,
    processOrderPaymentCallback: processOrderPaymentCallbackInternal,
    createOrder: createOrderInternal,
    checkOrderStatus: checkOrderStatusInternal,
    initializeOrderPayment: initializeOrderPaymentInternal,
    getOrderPaymentMethods: getOrderPaymentMethodsInternal,
    processOrderWebhook: processOrderWebhookInternal,
    getOrderDetail: getOrderDetailInternal,
    updateOrderFulfillment: updateOrderFulfillmentInternal
};

