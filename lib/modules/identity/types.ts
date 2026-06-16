export interface UserDTO {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
}

export interface SiteOwnerInfo {
    id: string;
    email: string | null;
    name: string | null;
    referredById: string | null;
}

export interface AwardCommissionDTO {
    userId: string;
    amount: number;
    transactionId: string;
    description: string;
}
