export interface PaymentMethod {
    paymentMethod: string;
    paymentName: string;
    paymentImage: string;
    totalFee: string;
    category?: string;
}

export interface TransactionData {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string | null;
    paymentUrl: string | null;
    paymentReference: string | null;
    createdAt: string;
    plan: { id: string; name: string; description: string | null } | null;
    site: { id: string; name: string } | null;
}

export interface CheckoutClientProps {
    transaction: TransactionData;
    platformName: string;
    isDuitkuConfigured: boolean;
    paymentGateway?: string;
    midtransApiType?: string;
    midtransClientKey?: string;
    midtransSandbox?: boolean;
}
