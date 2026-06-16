import { eventBus } from "@/modules/shared/core/event-bus";
import * as emailTemplates from "../services/email-templates.service";

/**
 * Menginisialisasi event listener untuk modul notification.
 */
export async function initNotificationListeners() {
  // Subscriber untuk notifikasi email terpadu lintas modul
  await eventBus.subscribe("notification.email.send", async (data: any) => {
    const { template, payload } = data;
    try {
      console.log(`[NotificationListener] Memproses kirim email template: ${template}`);
      
      switch (template) {
        case "welcome":
          await emailTemplates.sendWelcomeEmail(payload.toEmail, payload.userName, payload.siteName);
          break;
        case "paymentSuccess":
          await emailTemplates.sendPaymentSuccessEmail({
            toEmail: payload.toEmail,
            userName: payload.userName,
            siteName: payload.siteName,
            planName: payload.planName,
            amount: payload.amount,
            endDate: payload.endDate
          });
          break;
        case "withdrawalStatus":
          await emailTemplates.sendWithdrawalStatusEmail({
            toEmail: payload.toEmail,
            userName: payload.userName,
            amount: payload.amount,
            status: payload.status,
            bankDetails: payload.bankDetails
          });
          break;
        case "followup":
          await emailTemplates.sendFollowupEmail({
            toEmail: payload.toEmail,
            userName: payload.userName,
            subject: payload.subject,
            message: payload.message
          });
          break;
        case "trialExtended":
          await emailTemplates.sendTrialExtendedEmail({
            toEmail: payload.toEmail,
            userName: payload.userName,
            siteName: payload.siteName,
            days: payload.days,
            newEndDate: payload.newEndDate
          });
          break;
        case "domainVerified":
          await emailTemplates.sendDomainVerifiedEmail({
            toEmail: payload.toEmail,
            userName: payload.userName,
            siteName: payload.siteName,
            domain: payload.domain
          });
          break;
        case "subscriptionCancelled":
          await emailTemplates.sendSubscriptionCancelledEmail({
            toEmail: payload.toEmail,
            userName: payload.userName,
            siteName: payload.siteName,
            planName: payload.planName
          });
          break;
        default:
          console.warn(`[NotificationListener Warning] Template email tidak dikenal: ${template}`);
      }
    } catch (error) {
      console.error(`[NotificationListener Error] Gagal memproses kirim email template ${template}:`, error);
    }
  });
}
