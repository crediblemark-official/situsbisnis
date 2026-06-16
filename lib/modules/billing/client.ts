import { getPricingPlans, getActivePlanNamesForSites } from "./internal/services/plans";
import { checkSiteLimit } from "./internal/services/limits";
import { processApprovedTransaction, updateTransactionStatus } from "./internal/services/transaction";
import { LimitType, LimitCheckResult, PricingPlanDTO } from "./types";

export const BillingClient = {
    /**
     * Mengambil daftar paket langganan untuk dipublikasikan di halaman harga (Pricing).
     */
    async getPricingPlans(): Promise<PricingPlanDTO[]> {
        return getPricingPlans();
    },

    /**
     * Mengambil peta nama plan aktif berdasarkan daftar ID situs.
     */
    async getActivePlanNamesForSites(siteIds: string[]): Promise<Record<string, string>> {
        return getActivePlanNamesForSites(siteIds);
    },

    /**
     * Memeriksa apakah penggunaan fitur situs melampaui kuota paket aktif.
     */
    async checkSiteLimit(siteId: string, type: LimitType): Promise<LimitCheckResult> {
        return checkSiteLimit(siteId, type);
    },

    /**
     * Memproses persetujuan transaksi pembayaran dan mengaktifkan/memperbarui langganan.
     */
    async processApprovedTransaction(transactionId: string): Promise<any> {
        return processApprovedTransaction(transactionId);
    },

    /**
     * Memperbarui status transaksi secara manual (misal: reject/cancel) oleh admin.
     */
    async updateTransactionStatus(transactionId: string, status: string): Promise<any> {
        return updateTransactionStatus(transactionId, status);
    }
};

