export interface PaymentMethod {
    paymentMethod: string;
    paymentName: string;
    paymentImage: string;
    totalFee: string;
    category?: string;
}

export interface OrderData {
    id: string;
    amount: number;
    paymentUrl: string | null;
    paymentReference: string | null;
    customerName: string;
    siteName: string;
    createdAt: string;
}
