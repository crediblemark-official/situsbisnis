export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { eventBus } = await import("@/modules/shared/core/event-bus");
    const { initAuthListeners } = await import("@/modules/auth/listeners");
    const { initSiteListeners } = await import("@/modules/site/listeners");
    const { initDomainListeners } = await import("@/modules/domain/listeners");
    const { initInfrastructureListeners } = await import("@/modules/infrastructure/listeners");
    const { initPostListeners } = await import("@/modules/post/listeners");
    const { initMediaListeners } = await import("@/modules/media/listeners");
    const { initPageListeners } = await import("@/modules/page/listeners");
    const { initCatalogListeners } = await import("@/modules/catalog/listeners");
    const { initOrderListeners } = await import("@/modules/order/listeners");
    const { initSubscriptionListeners } = await import("@/modules/subscription/listeners");
    const { initPaymentListeners } = await import("@/modules/payment/listeners");
    const { initFinancialListeners } = await import("@/modules/financial/listeners");
    const { initNotificationListeners } = await import("@/modules/notification/listeners");
    const { initCrudListeners } = await import("@/modules/crud/listeners");
    
    // Inisialisasi koneksi broker
    await eventBus.init();
    
    // Inisialisasi semua listener modul
    await initAuthListeners();
    await initSiteListeners();
    await initDomainListeners();
    await initInfrastructureListeners();
    await initPostListeners();
    await initMediaListeners();
    await initPageListeners();
    await initCatalogListeners();
    await initOrderListeners();
    await initSubscriptionListeners();
    await initPaymentListeners();
    await initFinancialListeners();
    await initNotificationListeners();
    await initCrudListeners();
    
    console.log("🚀 Sistem Event-Driven berhasil diinisialisasi.");
  }
}
