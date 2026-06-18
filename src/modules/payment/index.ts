import {
    processApprovedTransaction,
    updateTransactionStatus,
    cancelTransaction,
    confirmManualPayment
} from "./services/transaction.service";
import {
    buySlot,
    initializeCheckoutPayment,
    upgradePlan
} from "./services/checkout.service";
import {
    checkTransactionStatus,
    getPaymentMethods,
    processDuitkuWebhook,
    processMidtransWebhook
} from "./services/webhook.service";


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
    processDuitkuWebhook,
    processMidtransWebhook
};
