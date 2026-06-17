import { eventBus } from "@/modules/shared/core/event-bus";
import { awardAffiliateCommissionInternal } from "../controllers/auth.controller";
import { db } from "@/modules/shared/core/db";

/**
 * Menginisialisasi seluruh event listener untuk modul auth.
 */
export async function initAuthListeners() {
  await eventBus.subscribe("affiliate.commission.awarded", async (data: any, _metadata) => {
    try {
      console.log(`[AuthListener] Memproses komisi afiliasi untuk transaksi: ${data.transactionId}, user: ${data.userId}`);

      // Idempotency check: skip if commission already exists for this transaction
      if (data.transactionId) {
        const existing = await db.commission.findFirst({
          where: { transactionId: data.transactionId }
        });
        if (existing) {
          console.log(`[AuthListener] Commission already exists for transaction ${data.transactionId}, skipping.`);
          return;
        }
      }
      
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

  // Reply listener untuk mengambil data pemilik situs
  eventBus.reply<{ siteId: string }, any>(
    "request.auth.getSiteOwner",
    async (data) => {
      const { getSiteOwnerInternal } = await import("../controllers/auth.controller");
      return getSiteOwnerInternal(data.siteId);
    }
  );

  eventBus.reply<{ userIds: string[] }, any>(
    "request.auth.getUsersMap",
    async (data) => {
      const { getUsersMapInternal } = await import("../controllers/auth.controller");
      return getUsersMapInternal(data.userIds);
    }
  );

  eventBus.reply<{ userId: string }, any>(
    "request.auth.getUserById",
    async (data) => {
      const { getUserByIdInternal } = await import("../controllers/auth.controller");
      return getUserByIdInternal(data.userId);
    }
  );

  eventBus.reply<{ userId: string; referredById: string }, any>(
    "request.auth.updateUserReferrer",
    async (data) => {
      const { updateUserReferrerInternal } = await import("../controllers/auth.controller");
      return updateUserReferrerInternal(data.userId, data.referredById);
    }
  );
}
