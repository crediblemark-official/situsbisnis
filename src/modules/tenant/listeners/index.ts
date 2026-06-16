import { eventBus } from "@/modules/shared/core/event-bus";
import { db } from "@/modules/shared/core/db";
import { getSiteContact, getSiteInfo } from "../services/tenant.service";
import { sendWhatsAppNotification } from "@/modules/shared/utils/services/whatsapp";

/**
 * Menginisialisasi seluruh event listener untuk modul tenant.
 */
export async function initTenantListeners() {
  await eventBus.subscribe("billing.payment.completed", async (data: any, metadata) => {
    const { transactionId, siteId, amount } = data;
    try {
      console.log(`[TenantListener] Memproses notifikasi pembayaran sukses untuk transaksi: ${transactionId}`);
      
      const siteContact = await getSiteContact(siteId);
      const siteInfo = await getSiteInfo(siteId);
      
      // Ambil data subscription aktif dari DB secara langsung
      const activeSub = await db.subscription.findFirst({
        where: { siteId, status: "active" },
        include: { plan: true }
      });

      const formattedEndDate = activeSub?.endDate
        ? new Date(activeSub.endDate).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })
        : "";

      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
      }).format(Number(amount));

      const planName = activeSub?.plan?.name?.toUpperCase() || "PAKET";
      const siteName = siteInfo?.name || "Website Anda";

      // 1. Kirim Notifikasi WhatsApp
      const recipientPhone = siteContact?.whatsappNumber || siteContact?.contactPhone;
      if (recipientPhone) {
        let message = `*SitusBisnis - Pembayaran Berhasil* 🎉\n\n`;
        message += `Halo Pengelola *${siteName}*,\n\n`;
        message += `Pembayaran Anda untuk paket *${planName}* sebesar *${formattedAmount}* telah berhasil diverifikasi dan disetujui.\n\n`;
        if (formattedEndDate) {
          message += `Layanan paket aktif/diperpanjang hingga: *${formattedEndDate}*.\n\n`;
        }
        message += `Terima kasih atas kepercayaan Anda menggunakan layanan kami!\n\n`;
        message += `_Pesan ini dikirim otomatis oleh sistem SitusBisnis._`;

        await sendWhatsAppNotification(recipientPhone, message);
        console.log(`[TenantListener] Notifikasi WhatsApp sukses dikirim ke ${recipientPhone}`);
      }

      // 2. Kirim Notifikasi Email
      const siteOwner = await eventBus.request<{ siteId: string }, { email: string | null; name: string | null } | null>(
        "request.auth.getSiteOwner",
        { siteId }
      );
      if (siteOwner && siteOwner.email) {
        const { sendPaymentSuccessEmail } = await import("@/modules/tenant/services/email.service");
        await sendPaymentSuccessEmail({
          toEmail: siteOwner.email,
          userName: siteOwner.name || "Pengguna",
          siteName,
          planName,
          amount: formattedAmount,
          endDate: formattedEndDate
        });
        console.log(`[TenantListener] Notifikasi Email sukses dikirim ke ${siteOwner.email}`);
      }
      
      console.log(`[TenantListener] Selesai memproses notifikasi pembayaran sukses untuk transaksi: ${transactionId}`);
    } catch (error) {
      console.error(`[TenantListener Error] Gagal memproses notifikasi pembayaran untuk transaksi: ${transactionId}:`, error);
    }
  });

  // Reply listener untuk mengelola custom domain
  eventBus.reply<{ siteId: string; domain: string }, any>(
    "request.tenant.registerDomain",
    async (data) => {
      const { registerDomain } = await import("../services/domain.service");
      return registerDomain(data.siteId, data.domain);
    }
  );

  eventBus.reply<{ siteId: string; domain: string }, any>(
    "request.tenant.removeDomain",
    async (data) => {
      const { removeDomain } = await import("../services/domain.service");
      return removeDomain(data.siteId, data.domain);
    }
  );

  eventBus.reply<{ siteId: string; domain: string }, any>(
    "request.tenant.verifyDomain",
    async (data) => {
      const { verifyDomain } = await import("../services/domain.service");
      return verifyDomain(data.siteId, data.domain);
    }
  );

  eventBus.reply<{ siteId: string }, any>(
    "request.tenant.getSiteInfo",
    async (data) => {
      const { getSiteInfo } = await import("../services/tenant.service");
      return getSiteInfo(data.siteId);
    }
  );

  eventBus.reply<{ userId: string; siteId: string }, any>(
    "request.tenant.verifyUserSiteAccess",
    async (data) => {
      const { verifyUserSiteAccess } = await import("../services/tenant.service");
      return verifyUserSiteAccess(data.userId, data.siteId);
    }
  );
}
