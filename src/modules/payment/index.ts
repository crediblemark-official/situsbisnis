import {
    processApprovedTransaction,
    updateTransactionStatus,
    buySlot,
    cancelTransaction,
    checkTransactionStatus,
    initializeCheckoutPayment,
    confirmManualPayment,
    getPaymentMethods,
    upgradePlan,
    processDuitkuWebhook
} from "./controllers/payment.controller";

export const PaymentClient = {
    processApprovedTransaction,
    updateTransactionStatus,
    buySlot,
    cancelTransaction,
    checkTransactionStatus,
    initializeCheckoutPayment,
    confirmManualPayment,
    getPaymentMethods,
    upgradePlan,
    processDuitkuWebhook
};
