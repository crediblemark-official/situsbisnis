import { NextResponse } from "next/server";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { IdentityClient } from "../index";
import { z } from "zod";
import { db } from "@/modules/shared/core/db";

const profileUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
});

const userCreateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    role: z.string().optional().default("user"),
    password: z.string().optional(),
});

const updateSiteSchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    customDomain: z.string().optional().nullable(),
});

export async function getProfileApi(_req: Request) {
    const { session, error, status } = await getApiContext(undefined, { requireSite: false });
    if (error) return apiError(error, status);
    if (!session?.user) return apiError("Unauthorized", 401);

    return apiResponse(session.user);
}

export async function updateProfileApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        if (!session?.user?.id) return apiError("Unauthorized", 401);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, profileUpdateSchema);
        if (vError) return apiError(vError, vStatus, details);

        await IdentityClient.updateUserProfile(session.user.email || "", data);

        return apiResponse({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return apiError("Internal Error", 500);
    }
}

export async function getUsersApi() {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
        if (error) return apiError(error, status);

        const isAdmin = session?.user?.role === "admin";
        const isTenantContext = !!siteId;

        if (isAdmin && !isTenantContext) {
            const users = await IdentityClient.getAdminUsersContext();
            return apiResponse({ users });
        }

        const users = await IdentityClient.getUsers(session?.user?.role || "owner", isTenantContext, siteId);
        return apiResponse({ users });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return apiError("Failed to fetch users");
    }
}

export async function createUserApi(req: Request) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, userCreateSchema);
        if (vError) return apiError(vError, vStatus, details);

        if (data.role === "admin" && session?.user?.role !== "admin") {
            return apiError("Forbidden: Only platform admins can assign the admin role", 403);
        }

        const result = await IdentityClient.createUserByAdmin(siteId, data, session?.user?.role || "");
        return apiResponse({ success: true, user: result });
    } catch (error) {
        console.error("Create User Error:", error);
        return apiError("Failed to create user");
    }
}

export async function getUserSitesApi() {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        if (!session?.user?.id) return apiError("Unauthorized", 401);

        const result = await IdentityClient.getUserSites(session.user.id);
        return apiResponse(result);
    } catch (error) {
        console.error("[USER_SITES_GET]", error);
        return apiError("Internal Server Error", 500);
    }
}

const verifySiteSchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    domain: z.string().min(1, "Domain is required"),
});

const userUpdateSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    role: z.string().optional(),
    password: z.string().optional(),
});

const affiliateWithdrawSchema = z.object({
    amount: z.coerce.number().min(50000, "Minimal penarikan adalah Rp 50.000"),
    bankName: z.string().min(1, "Bank name is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    accountName: z.string().min(1, "Account name is required"),
});

export async function verifyUserSiteApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";

        const { data, error: vError, details, status: vStatus } = await validateBody(req, verifySiteSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { siteId, domain } = data;

        const siteUser = await db.siteUser.findFirst({
            where: { siteId, userId }
        });
        if (!siteUser) return apiError("Site not found or access denied", 404);

        const { SubscriptionClient } = await import("@/modules/subscription");
        const subscription = await SubscriptionClient.findLatestSubscription(siteId);
        if (subscription?.plan?.name) {
            const planFeatures = (subscription.plan as any).features || {};
            const planName = subscription.plan.name;
            const { isFeatureEnabled } = await import("@/lib/billing/features");
            if (!isFeatureEnabled(planName, planFeatures, "hasCustomDomain")) {
                return apiError("Paket Anda tidak mendukung domain kustom.", 403);
            }
        }

        const result = await IdentityClient.verifySiteCustomDomain(userId, siteId, domain);
        if ((result as any)?.status === "error") {
            return apiError((result as any).message, 400, (result as any).details);
        }

        return apiResponse(result);
    } catch (error) {
        console.error("[USER_SITES_VERIFY]", error);
        return apiError("Internal Server Error");
    }
}

export async function updateUserApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("User ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, userUpdateSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await IdentityClient.updateUserByAdmin(id, siteId, data, session?.user?.id || "", session?.user?.role || "");
        return apiResponse(result);
    } catch (error: any) {
        console.error("Update User Error:", error);
        return apiError(error.message || "Failed to update user");
    }
}

export async function deleteUserApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("User ID required", 400);

        const result = await IdentityClient.deleteUserByAdmin(id, siteId, session?.user?.id || "", session?.user?.role || "");
        return apiResponse(result);
    } catch (error: any) {
        console.error("Delete User Error:", error);
        return apiError(error.message || "Failed to delete user");
    }
}

export async function checkAffiliateApi(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");

        if (!code) return apiError("Code is required", 400);

        const result = await IdentityClient.checkReferralCode(code);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[AFFILIATE_CHECK]", error);
        return apiError("Internal Error");
    }
}

export async function withdrawAffiliateApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);
        if (!session?.user?.id) return apiError("Unauthorized", 401);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, affiliateWithdrawSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { amount, bankName, accountNumber, accountName } = data;

        const result = await IdentityClient.requestAffiliateWithdrawal(session.user.id, amount, bankName, accountNumber, accountName);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[AFFILIATE_WITHDRAW]", error);
        if (error.message?.includes("tidak mencukupi")) {
            return apiError("Saldo tidak mencukupi", 400);
        }
        return apiError("Internal Error");
    }
}

export async function updateUserSiteApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, updateSiteSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { siteId, customDomain } = data;

        const newDomain = customDomain?.trim().toLowerCase() || null;

        const userId = session?.user?.id || "";

        if (newDomain) {
            await IdentityClient.verifySiteCustomDomain(userId, siteId, newDomain);
        }

        await IdentityClient.updateSiteCustomDomain(userId, siteId, newDomain);

        return apiResponse({ success: true, customDomain: newDomain });
    } catch (error) {
        console.error("[USER_SITES_PATCH]", error);
        return apiError("Internal Server Error", 500);
    }
}
