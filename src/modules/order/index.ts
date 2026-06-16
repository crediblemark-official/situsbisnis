import { 
    countOrdersInternal,
    getOrderByIdInternal,
    getPaymentSettingsInternal,
    processOrderPaymentCallbackInternal
} from "./actions";

// Facade / Client kontrak publik
export const OrderClient = {
    countOrders: countOrdersInternal,
    getOrderById: getOrderByIdInternal,
    getPaymentSettings: getPaymentSettingsInternal,
    processOrderPaymentCallback: processOrderPaymentCallbackInternal
};
