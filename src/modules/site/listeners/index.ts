import { eventBus } from "@/modules/shared/core/event-bus";
import { db } from "@/modules/shared/core/db";
import { getSiteContact, getSiteInfo } from "../services/tenant.service";
import { getSiteSettings } from "../services/settings.service";
import { sendWhatsAppNotification } from "@/modules/shared/utils/services/whatsapp";

export async function initSiteListeners() {
  await eventBus.subscribe("billing.payment.completed", async (data: any, _metadata) => {
    const { transactionId, siteId, amount } = data;
    try {
      console.log(`[SiteListener] Memproses notifikasi pembayaran sukses untuk transaksi: ${transactionId}`);

      const siteContact = await getSiteContact(siteId);
      const siteInfo = await getSiteInfo(siteId);

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

      const siteSettings = await getSiteSettings(siteId);
      const siteCurrency = siteSettings?.currency || "IDR";
      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: siteCurrency,
        minimumFractionDigits: 0
      }).format(Number(amount));

      const planName = activeSub?.plan?.name?.toUpperCase() || "PAKET";
      const siteName = siteInfo?.name || "Website Anda";

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
        console.log(`[SiteListener] Notifikasi WhatsApp sukses dikirim ke ${recipientPhone}`);
      }

      const siteOwner = await eventBus.request<{ siteId: string }, { email: string | null; name: string | null } | null>(
        "request.auth.getSiteOwner",
        { siteId }
      );
      if (siteOwner && siteOwner.email) {
        await eventBus.publish("notification.email.send", {
          template: "paymentSuccess",
          payload: {
            toEmail: siteOwner.email,
            userName: siteOwner.name || "Pengguna",
            siteName,
            planName,
            amount: formattedAmount,
            endDate: formattedEndDate
          }
        }, "site");
        console.log(`[SiteListener] Notifikasi Email sukses dikirim ke ${siteOwner.email}`);
      }

      console.log(`[SiteListener] Selesai memproses notifikasi pembayaran sukses untuk transaksi: ${transactionId}`);
    } catch (error) {
      console.error(`[SiteListener Error] Gagal memproses notifikasi pembayaran untuk transaksi: ${transactionId}:`, error);
    }
  });

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
