import * as billingRepo from "../repositories/withdrawal.repository";
import { db } from "@/modules/shared/core/db";
import { eventBus } from "@/modules/shared/core/event-bus";

/**
 * Memproses perubahan status penarikan saldo (withdrawal) oleh admin (approve/reject).
 */
export async function processWithdrawalStatus(withdrawalId: string, status: string) {
    if (!withdrawalId || !status) {
        throw new Error("Missing data");
    }

    let result;
    let user;

    await db.$transaction(async (tx) => {
        const currentWd = await billingRepo.findWithdrawalByIdTx(tx, withdrawalId);

        if (!currentWd) {
            throw new Error("NOT_FOUND");
        }

        if (currentWd.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }

        result = await billingRepo.updateWithdrawal(tx, withdrawalId, { status });

        // Jika ditolak, kembalikan saldo afiliasi ke user
        if (status === "rejected") {
            await billingRepo.incrementUserBalance(tx, currentWd.userId, Number(currentWd.amount));
        }
    });

    // Fetch user secara terpisah (soft reference — tanpa FK join)
    user = await db.user.findUnique({ where: { id: result.userId } });

    // Kirim email notifikasi status
    if (user?.email) {
        try {
            const formattedAmount = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0
            }).format(Number(result.amount));

            const bankDetails = `${result.bankName} - ${result.accountNumber} (a/n ${result.accountName})`;

            await eventBus.publish("notification.email.send", {
                template: "withdrawalStatus",
                payload: {
                    toEmail: user.email,
                    userName: user.name || "Pengguna",
                    amount: formattedAmount,
                    status: result.status as any,
                    bankDetails
                }
            }, "billing");
        } catch (err) {
            console.error("[WITHDRAWAL_EMAIL_ERROR] Failed to send email:", err);
        }
    }

    // Kirim WhatsApp notifikasi
    if (user?.phone) {
        try {
            const { sendWhatsAppNotification } = await import("@/lib/services/whatsapp");
            const formattedAmount = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0
            }).format(Number(result.amount));

            const bankDetails = `${result.bankName} - ${result.accountNumber} (a.n ${result.accountName})`;
            const isApproved = result.status === "approved";

            const message = isApproved
                ? `Halo *${user.name || "Pengguna"}*,\n\nPermintaan penarikan saldo Anda senilai *${formattedAmount}* telah *DISETUJUI & DITRANSFER* ke rekening:\n*${bankDetails}*.\n\nSilakan periksa mutasi rekening Anda secara berkala. Terima kasih! 🙏`
                : `Halo *${user.name || "Pengguna"}*,\n\nPermintaan penarikan saldo Anda senilai *${formattedAmount}* ke rekening:\n*${bankDetails}*\ntelah *DITOLAK*. Saldo Anda telah dikembalikan secara otomatis ke akun Anda.\n\nJika ada pertanyaan, silakan hubungi tim support kami.`;

            await sendWhatsAppNotification(user.phone, message);
        } catch (err) {
            console.error("[WITHDRAWAL_WHATSAPP_ERROR] Failed to send WA notification:", err);
        }
    }

    return result;
}
