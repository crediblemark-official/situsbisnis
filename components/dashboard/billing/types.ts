export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: any;
    priceYearly?: any;
    interval: string;
    features: any;
}

export interface Transaction {
    id: string;
    createdAt: string;
    amount: number;
    status: string;
    plan: {
        name: string;
    };
    addonType?: string;
    addonQuantity?: number;
    paymentMethod?: string | null;
    paymentUrl?: string | null;
}

export interface PaymentMethod {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions?: string;
}
