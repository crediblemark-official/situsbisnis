import { sendWhatsAppNotification } from "@/lib/services/whatsapp";
import { eventBus } from "@/modules/shared/core/event-bus";

/**
 * Mengirim notifikasi follow-up melalui WhatsApp (admin).
 */
export async function followupWhatsApp(phone: string, message: string) {
    if (!phone || !message) {
        throw new Error("Phone and message are required");
    }
    const result = await sendWhatsAppNotification(phone, message);
    if (!result.success) {
        throw new Error(result.error || "Failed to send WhatsApp follow-up");
    }
    return { success: true, message: "WhatsApp follow-up sent successfully", result: result.result };
}

/**
 * Mengirim notifikasi follow-up melalui Email (admin).
 */
export async function followupEmail(email: string, message: string, siteId: string) {
    if (!email || !message) {
        throw new Error("Email and message are required");
    }
    const siteOwner = siteId ? await eventBus.request<any, any>("request.auth.getSiteOwner", { siteId }) : null;
    const userName = siteOwner?.name || "Pengguna";

    const { sendFollowupEmail } = await import("@/modules/tenant/services/email.service");
    const result = await sendFollowupEmail({
        toEmail: email,
        userName,
        subject: `Pesan Penting Terkait Layanan Website Anda di SitusBisnis`,
        message
    });

    if (!result.success) {
        throw new Error(result.error || "Failed to send email follow-up");
    }

    return { success: true, message: "Email follow-up sent successfully", result: result.id };
}
