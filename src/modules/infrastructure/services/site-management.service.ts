import { SiteClient } from "@/modules/site";
import { FinancialClient } from "@/modules/financial";
import { IdentityClient } from "@/modules/auth";
import { revalidateTag } from "next/cache";

export async function manageSiteAction(siteId: string, action: "set_free" | "extend_trial") {
    // Ambil detail site untuk validasi
    const site = await SiteClient.getSiteDetail(siteId);
    if (!site) {
        throw new Error("SITE_NOT_FOUND");
    }

    if (action === "set_free") {
        await FinancialClient.setSiteToFreePlan(siteId);
        revalidateTag(`site-${siteId}`, "default");
        return { success: true, message: "Site set to Free plan" };
    }

    if (action === "extend_trial") {
        const result = await FinancialClient.extendSiteTrial(siteId, 7);
        const newEndDate = result.newEndDate;

        revalidateTag(`site-${siteId}`, "default");

        // Kirim email notifikasi ke pemilik site (fire and forget)
        const siteOwner = await IdentityClient.getSiteOwner(siteId);
        if (siteOwner && siteOwner.email) {
            const { sendTrialExtendedEmail } = await import("@/modules/notification");
            const formattedEndDate = newEndDate.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
            sendTrialExtendedEmail({
                toEmail: siteOwner.email,
                userName: siteOwner.name || "Pengguna",
                siteName: site.name,
                days: 7,
                newEndDate: formattedEndDate
            }).catch(err => {
                console.error("[EXTEND_TRIAL_EMAIL_ERROR] Failed to send email:", err);
            });
        }

        return { success: true, message: "Trial extended by 7 days" };
    }

    throw new Error("INVALID_ACTION");
}

export async function assignSiteOwner(siteId: string, email: string) {
    const { db } = await import("@/modules/shared/core/db");

    // 1. Validasi site
    const site = await db.site.findUnique({
        where: { id: siteId }
    });
    if (!site) {
        throw new Error("SITE_NOT_FOUND");
    }

    // 2. Cari user berdasarkan email
    const user = await db.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    // 3. Proses penghubungan pemilik
    // Hapus relasi pemilik (owner) lama jika ada
    await db.siteUser.deleteMany({
        where: {
            siteId,
            role: "owner"
        }
    });

    // Hapus relasi user terpilih pada situs ini (jika ada sebagai editor/role lain) untuk mencegah conflict unique key
    await db.siteUser.deleteMany({
        where: {
            siteId,
            userId: user.id
        }
    });

    // Buat relasi owner baru
    await db.siteUser.create({
        data: {
            siteId,
            userId: user.id,
            role: "owner"
        }
    });

    revalidateTag(`site-${siteId}`, "default");

    return { success: true, message: "Pemilik berhasil dihubungkan ke situs" };
}

