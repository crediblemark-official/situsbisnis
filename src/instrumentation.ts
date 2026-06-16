export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { eventBus } = await import("@/modules/shared/core/event-bus");
    const { initAuthListeners } = await import("@/modules/auth/listeners");
    const { initTenantListeners } = await import("@/modules/tenant/listeners");
    const { initContentListeners } = await import("@/modules/content/listeners");
    const { initCatalogListeners } = await import("@/modules/catalog/listeners");
    const { initOrderListeners } = await import("@/modules/order/listeners");
    const { initBillingListeners } = await import("@/modules/billing/listeners");
    const { initNotificationListeners } = await import("@/modules/notification/listeners");
    
    // Inisialisasi koneksi broker
    await eventBus.init();
    
    // Inisialisasi semua listener modul
    await initAuthListeners();
    await initTenantListeners();
    await initContentListeners();
    await initCatalogListeners();
    await initOrderListeners();
    await initBillingListeners();
    await initNotificationListeners();
    
    console.log("🚀 Sistem Event-Driven berhasil diinisialisasi.");
  }
}
