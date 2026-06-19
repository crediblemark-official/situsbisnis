import * as userRepo from "../repositories/user.repository";
import * as affiliateRepo from "../repositories/affiliate.repository";
import * as tenantUserRepo from "../repositories/tenant-user.repository";
import { eventBus } from "@/modules/shared/core/event-bus";
import { db } from "@/modules/shared/core/db";
import { SiteOwnerInfo } from "../index";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateReferralCode(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Mendapatkan pemilik site.
 */
export async function getSiteOwner(siteId: string): Promise<SiteOwnerInfo | null> {
    return tenantUserRepo.findSiteUserOwner(siteId);
}

/**
 * Registrasi user baru (SaaS onboarding).
 */
export async function registerUser(body: any, referralCodeFromCookie?: string) {
    const { email, password, name, phone, referralCode: reqReferralCode } = body;

    let referralCode = reqReferralCode || referralCodeFromCookie;

    if (!email || !password) {
        throw new Error("Email dan password wajib diisi");
    }

    if (password.length < 8) {
        throw new Error("Password minimal 8 karakter");
    }

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
        throw new Error("Nomor HP wajib diisi");
    }

    let formattedPhone = phone.replace(/[^0-9]/g, "");
    if (formattedPhone.startsWith("0")) {
        formattedPhone = "62" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("8")) {
        formattedPhone = "62" + formattedPhone;
    }

    const isIndonesian = /^628[1-9]\d{7,11}$/.test(formattedPhone);
    const isInternational = /^[1-9]\d{8,14}$/.test(formattedPhone) && !formattedPhone.startsWith("628");

    if (!isIndonesian && !isInternational) {
        throw new Error("Nomor HP tidak valid. Gunakan format yang benar (contoh: 0812xxx atau +62812xxx)");
    }

    const existingUser = await userRepo.findUserByEmail(email);
    if (existingUser) {
        throw new Error("Email sudah terdaftar");
    }

    const existingPhone = await userRepo.findUserByPhone(formattedPhone);
    if (existingPhone) {
        throw new Error("Nomor HP sudah terdaftar");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let referredById = null;
    if (referralCode) {
        const referrer = await affiliateRepo.findUserByReferralCode(referralCode);
        if (referrer) {
            referredById = referrer.id;
        }
    }

    let newReferralCode = generateReferralCode();
    let codeExists = true;
    while (codeExists) {
        const existingCode = await affiliateRepo.findUserByReferralCode(newReferralCode);
        if (!existingCode) {
            codeExists = false;
        } else {
            newReferralCode = generateReferralCode();
        }
    }

    const user = await userRepo.createUser({
        email,
        phone: formattedPhone,
        password: hashedPassword,
        name: name || email.split("@")[0],
        role: "owner",
        referralCode: newReferralCode,
        referredById
    });

    if (user.email) {
        eventBus.publish("notification.email.send", {
            template: "welcome",
            payload: {
                toEmail: user.email,
                userName: user.name || "Pengguna",
                siteName: "SitusBisnis"
            }
        }, "auth").catch((err: any) => {
            console.error("[Auth] Gagal publish welcome email event:", err);
        });
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        referralCode: user.referralCode
    };
}

/**
 * Validasi bridge token HMAC untuk login lintas subdomain.
 */
export async function verifyBridgeToken(token: string) {
    const secret = process.env.NEXTAUTH_SECRET!;

    const parts = token.split(".");
    if (parts.length !== 2) throw new Error("Malformed token");

    const [payloadB64, signature] = parts;
    const payload = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (signature !== expectedSig) {
        throw new Error("Invalid signature");
    }

    const data = JSON.parse(payload);

    if (data.exp < Date.now()) {
        throw new Error("Token expired");
    }

    const user = await userRepo.findUserById(data.userId);
    if (!user) {
        throw new Error("User not found");
    }

    return user;
}

/**
 * Mengambil daftar site yang dimiliki user.
 */
export async function getUserSites(userId: string) {
    const userSites = await tenantUserRepo.findUserSites(userId);
    const siteIds = (userSites || []).map(us => us.siteId);
    const sites = siteIds.length > 0
        ? await db.site.findMany({
            where: { id: { in: siteIds } },
            select: { id: true, name: true, subdomain: true, customDomain: true }
        })
        : [];
    return { sites };
}

/**
 * Mengubah kustom domain milik site (dilengkapi validasi dan pendaftaran Cloudflare/Dokploy).
 */
export async function updateSiteCustomDomain(userId: string, siteId: string, customDomain: string | null) {
    const siteUserLink = await tenantUserRepo.findSiteUserLink(siteId, userId, "owner");
    if (!siteUserLink) {
        throw new Error("Access denied");
    }

    const siteOwner = await tenantUserRepo.findSiteById(siteId);
    if (!siteOwner) throw new Error("Site not found");

    const newDomain = customDomain?.trim().toLowerCase() || null;

    if (newDomain) {
        const subscription = await tenantUserRepo.findSiteActiveSubscription(siteId);
        const planName = subscription?.plan?.name || "Free";
        const planFeatures = (subscription?.plan?.features as any) || {};

        const { isFeatureEnabled } = await import("@/lib/billing/features");
        if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
            throw new Error("Upgrade required");
        }
    }

    const oldDomain = siteOwner.customDomain;

    if (newDomain && newDomain !== oldDomain) {
        if (oldDomain) {
            await eventBus.request("request.tenant.removeDomain", { siteId, domain: oldDomain });
        }
        const regResult = await eventBus.request<any, any>("request.tenant.registerDomain", { siteId, domain: newDomain });
        if (regResult.status === "error") {
            throw new Error(regResult.message);
        }
    } else if (!newDomain && oldDomain) {
        await eventBus.request("request.tenant.removeDomain", { siteId, domain: oldDomain });
    }

    await tenantUserRepo.updateSiteCustomDomain(siteId, newDomain);
    return { success: true, customDomain: newDomain };
}

/**
 * Memverifikasi CNAME/A-Record kustom domain milik site.
 */
export async function verifySiteCustomDomain(userId: string, siteId: string, domain: string) {
    const siteUserLink = await tenantUserRepo.findSiteUserLink(siteId, userId, "owner");
    if (!siteUserLink) {
        throw new Error("Access denied");
    }

    const subscription = await tenantUserRepo.findSiteActiveSubscription(siteId);
    const planName = subscription?.plan?.name || "Free";
    const planFeatures = (subscription?.plan?.features as any) || {};

    const { isFeatureEnabled } = await import("@/lib/billing/features");
    if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
        throw new Error("Upgrade required");
    }

    const result = await eventBus.request<any, any>("request.tenant.verifyDomain", { siteId, domain });
    if (result.status === "error") {
        throw new Error(result.message);
    }

    return result;
}
