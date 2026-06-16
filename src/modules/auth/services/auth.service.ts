import * as userRepo from "../repositories/user.repository";
import { SiteOwnerInfo, UserDTO, AwardCommissionDTO } from "../index";
import { db } from "@/modules/shared/core/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Role } from "@prisma/client";

function generateReferralCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Mendapatkan pemilik site.
 */
export async function getSiteOwner(siteId: string): Promise<SiteOwnerInfo | null> {
    return userRepo.findSiteUserOwner(siteId);
}

/**
 * Mendapatkan data user berdasarkan ID.
 */
export async function getUserById(userId: string): Promise<UserDTO | null> {
    const user = await userRepo.findUserById(userId);
    return user as UserDTO | null;
}

/**
 * Mendapatkan map dari banyak user.
 */
export async function getUsersMap(userIds: string[]): Promise<Record<string, UserDTO>> {
    if (userIds.length === 0) return {};
    const users = await userRepo.findUsersByIds(userIds);
    
    const resultMap: Record<string, UserDTO> = {};
    users.forEach(u => {
        resultMap[u.id] = u as UserDTO;
    });
    return resultMap;
}

/**
 * Memberikan komisi afiliasi kepada referrer user.
 */
export async function awardAffiliateCommission(
    dbClient: any,
    data: AwardCommissionDTO
): Promise<void> {
    const client = dbClient || db;
    await userRepo.createCommission(client, data.userId, data.amount, data.transactionId, data.description);
    await userRepo.incrementUserBalance(client, data.userId, data.amount);
}

/**
 * Memproses permintaan penarikan dana afiliasi (withdrawal).
 */
export async function requestAffiliateWithdrawal(
    userId: string,
    amount: number,
    bankName: string,
    accountNumber: string,
    accountName: string,
    notes?: string
) {
    return db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { affiliateBalance: true }
        });

        if (!user) {
            throw new Error("User tidak ditemukan.");
        }

        const balance = Number(user.affiliateBalance);
        if (balance < amount) {
            throw new Error("Saldo Anda tidak mencukupi untuk melakukan penarikan.");
        }

        await userRepo.decrementUserBalance(tx, userId, amount);

        const withdrawal = await userRepo.createUserWithdrawal(
            tx,
            userId,
            amount,
            bankName,
            accountNumber,
            accountName,
            notes
        );

        return withdrawal;
    });
}

/**
 * Memeriksa status keuangan afiliasi milik user.
 */
export async function checkAffiliateStatus(userId: string) {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            affiliateBalance: true,
            referralCode: true
        }
    });

    if (!user) return null;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: Number(user.affiliateBalance),
        referralCode: user.referralCode
    };
}

/**
 * Memperbarui referrer afiliasi seorang user.
 */
export async function updateUserReferrer(userId: string, referredById: string): Promise<void> {
    await userRepo.updateUserReferrer(userId, referredById);
}

/**
 * Memeriksa keberadaan kode referral.
 */
export async function checkReferralCode(code: string): Promise<{ exists: boolean; name?: string | null }> {
    const user = await userRepo.findUserByReferralCode(code);
    if (!user) {
        return { exists: false };
    }
    return { exists: true, name: user.name };
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
        const referrer = await userRepo.findUserByReferralCode(referralCode);
        if (referrer) {
            referredById = referrer.id;
        }
    }

    let newReferralCode = generateReferralCode();
    let codeExists = true;
    while (codeExists) {
        const existingCode = await userRepo.findUserByReferralCode(newReferralCode);
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
        const { sendWelcomeEmail } = await import("@/lib/services/email");
        sendWelcomeEmail(user.email, user.name || "Pengguna", "SitusBisnis").catch(err => {
            console.error("[WELCOME_EMAIL_ERROR] Failed to send welcome email:", err);
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
 * Mengubah data profil user sendiri (nama & ganti password).
 */
export async function updateUserProfile(email: string, body: any) {
    const { name, currentPassword, newPassword } = body;

    const currentUser = await userRepo.findUserByEmail(email);
    if (!currentUser) {
        throw new Error("User not found");
    }

    const updateData: any = {};
    if (name) updateData.name = name;

    if (newPassword) {
        if (!currentPassword) {
            throw new Error("Current password required");
        }

        if (currentUser.password) {
            const passwordsMatch = await bcrypt.compare(currentPassword, currentUser.password);
            if (!passwordsMatch) {
                throw new Error("Incorrect current password");
            }
        }

        updateData.password = await bcrypt.hash(newPassword, 10);
    }

    await userRepo.updateUser(currentUser.id, updateData);
    return { success: true };
}

/**
 * Mengambil daftar user di level platform (admin) atau di level site (owner/editor).
 */
export async function getUsers(sessionRole: string, isTenantContext: boolean, siteId?: string) {
    let rawUsers;
    if (sessionRole === "admin" && !isTenantContext) {
        rawUsers = await userRepo.findAllUsers();
    } else {
        if (!siteId) throw new Error("Site ID required");
        const userIds = await userRepo.findSiteUserIds(siteId);
        rawUsers = await userRepo.findSiteUsersExceptAdmin(userIds);
    }

    const postCounts = await userRepo.countPostsGroupedByAuthor(isTenantContext ? siteId : undefined);
    const postCountMap = new Map(postCounts.map(pc => [pc.authorId, pc._count.id]));

    const users = rawUsers.map(user => ({
        ...user,
        _count: {
            posts: postCountMap.get(user.id) || 0
        }
    }));

    return { users };
}

/**
 * Membuat user baru oleh admin atau owner.
 */
export async function createUserByAdmin(siteId: string | undefined, data: any, sessionRole: string) {
    const { name, email, role } = data;

    if (role === "admin" && sessionRole !== "admin") {
        throw new Error("Forbidden: Only platform admins can assign the admin role");
    }

    let user = await userRepo.findUserByEmail(email);

    if (user) {
        if (siteId) {
            await userRepo.upsertSiteUser(siteId, user.id);
        }
    } else {
        const hashedPassword = await bcrypt.hash("change-me", 10);
        user = await userRepo.createUser({
            name,
            email,
            password: hashedPassword,
            role: (role as Role) || Role.user,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`
        });

        if (siteId && user) {
            await userRepo.createSiteUser(siteId, user.id);
        }
    }

    return user;
}

/**
 * Memperbarui user oleh admin atau owner.
 */
export async function updateUserByAdmin(
    userId: string,
    siteId: string | undefined,
    data: any,
    sessionUserId: string,
    sessionRole: string
) {
    const { role, name, email, password } = data;

    const targetUser = await userRepo.findUserById(userId);
    if (!targetUser) throw new Error("User not found");

    if (sessionRole !== "admin") {
        if (!siteId) throw new Error("Site context required");
        const belongs = await userRepo.findSiteUserLink(siteId, userId);
        if (!belongs) throw new Error("User not found in site");

        if (targetUser.role === "admin") {
            throw new Error("Forbidden: Cannot modify a platform admin");
        }

        if (role === "admin") {
            throw new Error("Forbidden: Only platform admins can assign the admin role");
        }
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password && password.trim() !== "") {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await userRepo.updateUser(userId, updateData);
    return { success: true };
}


/**
 * Menghapus/menghilangkan user oleh admin atau owner.
 */
export async function deleteUserByAdmin(
    userId: string,
    siteId: string | undefined,
    sessionUserId: string,
    sessionRole: string
) {
    if (userId === sessionUserId) {
        throw new Error("Cannot delete yourself");
    }

    const { getTenant } = await import("@/lib/domains/tenant");
    const tenant = await getTenant();
    const isTenantContext = !!siteId && tenant !== null && tenant !== "admin";

    if (sessionRole !== "admin" || isTenantContext) {
        if (!siteId) throw new Error("Site context required");
        const belongs = await userRepo.findSiteUserLink(siteId, userId);
        if (!belongs) throw new Error("User not found in site");

        await userRepo.deleteSiteUserLinks(siteId, userId);
        return { success: true, removed: true };
    }

    await userRepo.deleteUserPosts(userId);
    await userRepo.deleteUser(userId);

    return { success: true };
}

/**
 * Mengambil daftar site yang dimiliki user.
 */
export async function getUserSites(userId: string) {
    const sites = await userRepo.findUserSites(userId);
    return { sites: sites || [] };
}

/**
 * Mengubah kustom domain milik site (dilengkapi validasi dan pendaftaran Cloudflare/Dokploy).
 */
export async function updateSiteCustomDomain(userId: string, siteId: string, customDomain: string | null) {
    const siteUserLink = await userRepo.findSiteUserLink(siteId, userId, "owner");
    if (!siteUserLink) {
        throw new Error("Access denied");
    }

    const siteOwner = await userRepo.findSiteById(siteId);
    if (!siteOwner) throw new Error("Site not found");

    const newDomain = customDomain?.trim().toLowerCase() || null;

    if (newDomain) {
        const subscription = await userRepo.findSiteActiveSubscription(siteId);
        const planName = subscription?.plan?.name || "Free";
        const planFeatures = (subscription?.plan?.features as any) || {};

        const { isFeatureEnabled } = await import("@/lib/billing/features");
        if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
            throw new Error("Upgrade required");
        }
    }

    const { DomainService } = await import("@/lib/services/domain.service");
    const oldDomain = siteOwner.customDomain;

    if (newDomain && newDomain !== oldDomain) {
        if (oldDomain) {
            await DomainService.removeDomain(siteId, oldDomain);
        }
        const regResult = await DomainService.registerDomain(siteId, newDomain);
        if (regResult.status === "error") {
            throw new Error(regResult.message);
        }
    } else if (!newDomain && oldDomain) {
        await DomainService.removeDomain(siteId, oldDomain);
    }

    await userRepo.updateSiteCustomDomain(siteId, newDomain);
    return { success: true, customDomain: newDomain };
}

/**
 * Memverifikasi CNAME/A-Record kustom domain milik site.
 */
export async function verifySiteCustomDomain(userId: string, siteId: string, domain: string) {
    const siteUserLink = await userRepo.findSiteUserLink(siteId, userId, "owner");
    if (!siteUserLink) {
        throw new Error("Access denied");
    }

    const subscription = await userRepo.findSiteActiveSubscription(siteId);
    const planName = subscription?.plan?.name || "Free";
    const planFeatures = (subscription?.plan?.features as any) || {};

    const { isFeatureEnabled } = await import("@/lib/billing/features");
    if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
        throw new Error("Upgrade required");
    }

    const { DomainService } = await import("@/lib/services/domain.service");
    const result = await DomainService.verifyDomain(siteId, domain);
    if (result.status === "error") {
        throw new Error(result.message);
    }

    return result;
}


