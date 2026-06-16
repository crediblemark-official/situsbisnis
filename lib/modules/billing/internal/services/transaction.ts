import { db } from "@/lib/core/db";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";
import { TenantClient } from "@/lib/modules/tenant/client";
import { IdentityClient } from "@/lib/modules/identity/client";

export async function processApprovedTransaction(transactionId: string) {
    const updatedTx = await db.$transaction(async (tx) => {
        // Ambil data transaksi beserta paket langganannya (Prisma relation internal)
        const currentTx = await tx.paymentTransaction.findUnique({
            where: { id: transactionId },
            include: { plan: true }
        });

        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }

        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }

        // Perbarui status transaksi
        const updatedTx = await tx.paymentTransaction.update({
            where: { id: transactionId },
            data: { status: "approved" },
            include: { plan: true }
        });

        if (updatedTx.couponId) {
            await tx.coupon.update({
                where: { id: updatedTx.couponId },
                data: { usedCount: { increment: 1 } }
            });
        }

        // Ambil pemilik situs melalui modul Identity (Klien Kontrak)
        const siteOwner = await IdentityClient.getSiteOwner(updatedTx.siteId);

        // Ambil info dasar situs melalui modul Tenant (Klien Kontrak)
        const siteInfo = await TenantClient.getSiteInfo(updatedTx.siteId);

        // Logika Komisi Afiliasi (jika pemilik situs direferensikan oleh orang lain)
        if (siteOwner && siteOwner.referredById) {
            // Ambil pengaturan komisi global dari platform
            const platformSettings = await tx.platformSettings.findUnique({
                where: { id: "global" }
            });
            
            const isRecurringEnabled = platformSettings?.affiliateRecurringCommission ?? false;
            
            // Hitung jumlah transaksi disetujui untuk situs tersebut
            const approvedTxCount = await tx.paymentTransaction.count({
                where: {
                    siteId: updatedTx.siteId,
                    status: "approved"
                }
            });

            let shouldAwardCommission = true;
            if (!isRecurringEnabled) {
                // Karena status transaksi ini baru saja diubah ke approved, count akan bernilai 1 jika ini transaksi disetujui pertama
                if (approvedTxCount > 1) {
                    shouldAwardCommission = false;
                }
            }

            if (shouldAwardCommission) {
                let ratePercentage = 20;
                if (approvedTxCount > 1) {
                    ratePercentage = platformSettings?.affiliateRecurringCommissionRate ? Number(platformSettings.affiliateRecurringCommissionRate) : 10;
                } else {
                    ratePercentage = platformSettings?.affiliateCommissionRate ? Number(platformSettings.affiliateCommissionRate) : 20;
                }
                
                const commissionAmount = Number(updatedTx.amount) * (ratePercentage / 100);
                
                // Berikan komisi afiliasi melalui modul Identity (Kontrak)
                // Teruskan transaksi Prisma 'tx' agar tetap atomik
                await IdentityClient.awardAffiliateCommission(tx, {
                    userId: siteOwner.referredById,
                    amount: commissionAmount,
                    transactionId: updatedTx.id,
                    description: `Komisi pembayaran dari situs ${siteInfo?.name || "website"}`
                });
            }
        }

        // Penanganan upgrade paket vs pembelian slot addon
        if (updatedTx.addonType === "site_slot") {
            const existingSub = await tx.subscription.findFirst({
                where: { siteId: updatedTx.siteId, status: "active" }
            });

            if (existingSub) {
                await tx.subscription.update({
                    where: { id: existingSub.id },
                    data: {
                        addonSlots: {
                            increment: updatedTx.addonQuantity || 0
                        }
                    }
                });
            }
        } else {
            // Dapatkan addon slots dari langganan aktif sebelum dinonaktifkan
            const activeSubBeforeUpgrade = await tx.subscription.findFirst({
                where: { siteId: updatedTx.siteId, status: "active" }
            });
            const carryOverSlots = activeSubBeforeUpgrade?.addonSlots || 0;

            // 1. Nonaktifkan semua langganan aktif sebelumnya
            await tx.subscription.updateMany({
                where: { siteId: updatedTx.siteId },
                data: { status: "cancelled" }
            });

            const now = new Date();
            const endDate = new Date(now);
            
            if (updatedTx.plan.interval === "year") {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // 2. Gunakan kembali langganan jika sebelumnya sudah ada relasi paket ini, atau buat baru
            const existingSubOfThisPlan = await tx.subscription.findFirst({
                where: { siteId: updatedTx.siteId, planId: updatedTx.planId }
            });

            if (existingSubOfThisPlan) {
                await tx.subscription.update({
                    where: { id: existingSubOfThisPlan.id },
                    data: {
                        status: "active",
                        endDate: endDate,
                        trialEndsAt: null,
                        addonSlots: Math.max(existingSubOfThisPlan.addonSlots, carryOverSlots)
                    }
                });
            } else {
                await tx.subscription.create({
                    data: {
                        siteId: updatedTx.siteId,
                        planId: updatedTx.planId,
                        status: "active",
                        startDate: now,
                        endDate: endDate,
                        addonSlots: carryOverSlots
                    }
                });
            }
        }

        return updatedTx;
    }, {
        maxWait: 15000,
        timeout: 45000,
    });

    // Jalankan pengiriman notifikasi secara asinkron
    if (updatedTx && updatedTx.status === "approved") {
        try {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${updatedTx.siteId}`, "default");
        } catch (e) {
            console.error("Failed to revalidate subscription cache:", e);
        }

        (async () => {
            try {
                // Ambil info kontak dan detail situs dari modul Tenant (Kontrak)
                const siteContact = await TenantClient.getSiteContact(updatedTx.siteId);
                const siteInfo = await TenantClient.getSiteInfo(updatedTx.siteId);

                const activeSub = await db.subscription.findFirst({
                    where: { siteId: updatedTx.siteId, status: "active" }
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
                }).format(Number(updatedTx.amount));

                const planName = updatedTx.plan.name.toUpperCase();
                const siteName = siteInfo?.name || "Website Anda";

                // 1. Notifikasi WhatsApp
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
                }

                // 2. Notifikasi Email
                const siteOwner = await IdentityClient.getSiteOwner(updatedTx.siteId);
                if (siteOwner && siteOwner.email) {
                    const { sendPaymentSuccessEmail } = await import("@/lib/services/email");
                    await sendPaymentSuccessEmail({
                        toEmail: siteOwner.email,
                        userName: siteOwner.name || "Pengguna",
                        siteName,
                        planName,
                        amount: formattedAmount,
                        endDate: formattedEndDate
                    });
                }
            } catch (error) {
                console.error("[NOTIFICATION_TRIGGER_ERROR]", error);
            }
        })();
    }

    return updatedTx;
}

export async function updateTransactionStatus(transactionId: string, status: string) {
    return db.$transaction(async (tx) => {
        const currentTx = await tx.paymentTransaction.findUnique({
            where: { id: transactionId }
        });

        if (!currentTx) {
            throw new Error("TRANSACTION_NOT_FOUND");
        }

        if (currentTx.status !== "pending") {
            throw new Error("ALREADY_PROCESSED");
        }

        return await tx.paymentTransaction.update({
            where: { id: transactionId },
            data: { status: status as any },
            include: { plan: true }
        });
    });
}
