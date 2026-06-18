import { eventBus } from "@/modules/shared/core/event-bus";
import { incrementCouponUses } from "../repositories/coupon.repository";

export async function initFinancialListeners() {
  await eventBus.subscribe("billing.payment.completed", async (data: any, _metadata) => {
    try {
      if (data.couponId) {
        console.log(`[FinancialListener] Menambahkan jumlah pemakaian kupon ID: ${data.couponId} untuk transaksi ${data.transactionId}`);
        await incrementCouponUses(null, data.couponId);
      }
    } catch (err) {
      console.error(`[FinancialListener Error] Gagal menambahkan jumlah pemakaian kupon untuk transaksi ${data.transactionId}:`, err);
    }
  });
}
