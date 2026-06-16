export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { eventBus } = await import("@/modules/shared/core/event-bus");
    const { initAuthListeners } = await import("@/modules/auth/listeners");
    
    // Inisialisasi koneksi broker
    await eventBus.init();
    
    // Inisialisasi semua listener modul
    await initAuthListeners();
    
    console.log("🚀 Sistem Event-Driven berhasil diinisialisasi.");
  }
}
