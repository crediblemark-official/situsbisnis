import * as tenantRepo from "../repositories/tenant.repository";

/**
 * Membuat contact submission baru.
 */
export async function createContactSubmission(siteId: string, data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
}) {
    return tenantRepo.createContactSubmission({ siteId, ...data });
}

/**
 * Mengambil daftar contact submission untuk suatu situs.
 */
export async function getContactSubmissions(siteId: string, options?: { skip?: number; take?: number }) {
    return tenantRepo.findContactSubmissions(siteId, options);
}

/**
 * Menghitung total contact submission untuk suatu situs.
 */
export async function countContactSubmissions(siteId: string): Promise<number> {
    return tenantRepo.countContactSubmissions(siteId);
}

/**
 * Menyimpan pengaturan pembayaran untuk suatu situs.
 */
export async function savePaymentSettings(siteId: string, data: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    currency?: string;
    instructions?: string;
    gatewayEnabled?: boolean;
    manualEnabled?: boolean;
}) {
    return tenantRepo.upsertPaymentSettings(siteId, data);
}
