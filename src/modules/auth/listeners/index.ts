import { eventBus } from "@/modules/shared/core/event-bus";
import { awardAffiliateCommissionInternal } from "../controllers/auth.controller";
import { db } from "@/modules/shared/core/db";

/**
 * Menginisialisasi seluruh event listener untuk modul auth.
 */
export async function initAuthListeners() {
  await eventBus.subscribe("affiliate.commission.awarded", async (data: any, metadata) => {
    try {
      console.log(`[AuthListener] Memproses komisi afiliasi untuk transaksi: ${data.transactionId}, user: ${data.userId}`);
      
      // Panggil controller internal modul auth untuk memberikan komisi
      await awardAffiliateCommissionInternal(db, {
        userId: data.userId,
        amount: data.amount,
        transactionId: data.transactionId,
        description: data.description
      });
      
      console.log(`[AuthListener] Sukses memproses komisi afiliasi untuk transaksi: ${data.transactionId}`);
    } catch (error) {
      console.error(`[AuthListener Error] Gagal memproses komisi afiliasi untuk transaksi: ${data.transactionId}:`, error);
    }
  });
}
