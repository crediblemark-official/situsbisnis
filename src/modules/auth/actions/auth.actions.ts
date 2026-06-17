"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IdentityClient } from "@/modules/auth";
import { SiteClient } from "@/modules/site";
import { InfrastructureClient } from "@/modules/infrastructure";
import { SubscriptionClient } from "@/modules/subscription";
import { cookies } from "next/headers";
import { z } from "zod";

const profileUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
});

const onboardingSchema = z.object({
    siteName: z.string().min(1, "Site name is required"),
    subdomain: z.string().min(1, "Subdomain is required"),
});

export async function updateProfileAction(body: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return { success: false, error: "Unauthorized" };
        }

        const validation = profileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return { 
                success: false, 
                error: "Validation failed", 
                details: validation.error.format() 
            };
        }

        try {
            await IdentityClient.updateUserProfile(session.user.email, validation.data);
            return { success: true, message: "Profile updated successfully" };
        } catch (err: any) {
            const message = err.message;
            if (message === "User not found") {
                return { success: false, error: "User not found" };
            }
            if (message === "Current password required" || message === "Incorrect current password") {
                return { success: false, error: message };
            }
            throw err;
        }
    } catch (error: any) {
        console.error("[PROFILE_UPDATE_ACTION]", error);
        return { success: false, error: "Internal Error" };
    }
}

export async function registerUserAction(body: any) {
    try {
        const cookieStore = await cookies();
        const referralCodeFromCookie = cookieStore.get("situsbisnis_ref_code")?.value;

        try {
            const user = await IdentityClient.registerUser(body, referralCodeFromCookie);
            return { success: true, user };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    } catch (error) {
        console.error("[REGISTER_ACTION] Error:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

export async function completeOnboardingAction(body: any) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return { success: false, error: "Unauthorized" };

        const validation = onboardingSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const { siteName, subdomain } = validation.data;
        const normalizedSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

        // 1. Cek ketersediaan subdomain
        try {
            await SiteClient.checkSubdomainAvailability(normalizedSubdomain);
        } catch (err: any) {
            if (err?.message === "SUBDOMAIN_TAKEN") {
                return { success: false, error: "Subdomain already taken" };
            }
            throw err;
        }

        // 2. Ambil jumlah site milik user
        const { siteIds, count: userSitesCount } = await SiteClient.getUserSiteCount(session.user.id);

        // 3. Validasi limit jumlah situs dari paket langganan
        const limitCheck = await SubscriptionClient.checkUserSitesLimit(siteIds, userSitesCount);
        if (!limitCheck.allowed) {
            return { success: false, error: limitCheck.message || "Batas situs tercapai" };
        }

        // 4. Provision site baru via TenantClient
        const site = await InfrastructureClient.provisionSite(session.user.id, siteName, normalizedSubdomain);

        return { success: true, site };
    } catch (error) {
        console.error("[ONBOARDING_ACTION] Error:", error);
        return { success: false, error: "Failed to create site" };
    }
}

export async function requestAffiliateWithdrawalAction(body: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { amount, bankName, accountNumber, accountName } = body;
        if (!amount || !bankName || !accountNumber || !accountName) {
            return { success: false, error: "Data tidak lengkap" };
        }

        const withdrawAmount = Number(amount);
        if (isNaN(withdrawAmount) || withdrawAmount < 50000) {
            return { success: false, error: "Minimal penarikan adalah Rp 50.000" };
        }

        const result = await IdentityClient.requestAffiliateWithdrawal(
            session.user.id,
            withdrawAmount,
            bankName,
            accountNumber,
            accountName
        );

        return { success: true, result };
    } catch (error: any) {
        console.error("[AFFILIATE_WITHDRAW_ACTION]", error);
        if (error.message === "Saldo Anda tidak mencukupi untuk melakukan penarikan.") {
            return { success: false, error: "Saldo tidak mencukupi" };
        }
        return { success: false, error: "Internal Error" };
    }
}
