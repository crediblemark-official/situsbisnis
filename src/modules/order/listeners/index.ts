import { eventBus } from "@/modules/shared/core/event-bus";
import * as orderService from "../services/order.service";

/**
 * Menginisialisasi event listener dan reply handler untuk modul order.
 */
export async function initOrderListeners() {
  await eventBus.reply("request.order.countOrders", async (data: { siteId: string }) => {
    try {
      return await orderService.countOrders(data.siteId);
    } catch (e) {
      console.error(`[OrderListener] Gagal menghitung order untuk site ${data.siteId}:`, e);
      return 0;
    }
  });
}
