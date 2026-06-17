import { eventBus } from "@/modules/shared/core/event-bus";
import * as contentService from "../services/content.service";

/**
 * Menginisialisasi event listener dan reply handler untuk modul content.
 */
export async function initPageListeners() {
  await eventBus.reply("request.content.countPosts", async (data: { siteId: string }) => {
    try {
      return await contentService.countPosts(data.siteId);
    } catch (e) {
      console.error(`[ContentListener] Gagal menghitung post untuk site ${data.siteId}:`, e);
      return 0;
    }
  });

  await eventBus.reply("request.content.countTestimonials", async (data: { siteId: string }) => {
    try {
      return await contentService.countTestimonials(data.siteId);
    } catch (e) {
      console.error(`[ContentListener] Gagal menghitung testimonial untuk site ${data.siteId}:`, e);
      return 0;
    }
  });

  await eventBus.reply("request.content.getMediaSize", async (data: { siteId: string }) => {
    try {
      return await contentService.getMediaSize(data.siteId);
    } catch (e) {
      console.error(`[ContentListener] Gagal mendapatkan ukuran media untuk site ${data.siteId}:`, e);
      return 0;
    }
  });
}
