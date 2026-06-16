import { eventBus } from "@/modules/shared/core/event-bus";
import * as catalogService from "../services/catalog.service";

/**
 * Menginisialisasi event listener dan reply handler untuk modul catalog.
 */
export async function initCatalogListeners() {
  await eventBus.reply("request.catalog.countProducts", async (data: { siteId: string }) => {
    try {
      return await catalogService.countProducts(data.siteId);
    } catch (e) {
      console.error(`[CatalogListener] Gagal menghitung produk untuk site ${data.siteId}:`, e);
      return 0;
    }
  });

  await eventBus.reply("request.catalog.getProducts", async (data: { siteId: string }) => {
    try {
      return await catalogService.getProducts(data.siteId);
    } catch (e) {
      console.error(`[CatalogListener] Gagal memuat produk untuk site ${data.siteId}:`, e);
      return [];
    }
  });

  await eventBus.reply("request.catalog.getProduct", async (data: { slug: string; siteId: string }) => {
    try {
      return await catalogService.getProduct(data.slug, data.siteId);
    } catch (e) {
      console.error(`[CatalogListener] Gagal memuat produk ${data.slug} untuk site ${data.siteId}:`, e);
      return null;
    }
  });

  await eventBus.reply("request.catalog.searchProducts", async (data: { siteId: string; q: string; limit?: number }) => {
    try {
      return await catalogService.searchProducts(data.siteId, data.q, data.limit);
    } catch (e) {
      console.error(`[CatalogListener] Gagal mencari produk untuk site ${data.siteId}:`, e);
      return [];
    }
  });

  await eventBus.reply("request.catalog.getProductsMap", async (data: { productIds: string[] }) => {
    try {
      return await catalogService.getProductsMap(data.productIds);
    } catch (e) {
      console.error(`[CatalogListener] Gagal memuat map produk untuk IDs ${data.productIds}:`, e);
      return {};
    }
  });
}
