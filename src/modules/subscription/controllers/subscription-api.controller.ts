import { NextRequest, NextResponse } from "next/server";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { SubscriptionClient } from "../index";

/**
 * Handler GET untuk mendapatkan daftar plans (admin).
 */
export async function getPlansApi() {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const plans = await SubscriptionClient.getAllPlans();
        return apiResponse(plans);
    } catch (error) {
        console.error("Fetch Plans Error:", error);
        return apiError("Failed to fetch plans");
    }
}

/**
 * Handler GET untuk mendapatkan pricing plans (publik).
 */
export async function getPricingPlansApi() {
    try {
        const plans = await SubscriptionClient.getPricingPlans();
        return apiResponse(plans);
    } catch (error) {
        console.error("Fetch Pricing Plans Error:", error);
        return apiError("Failed to fetch plans");
    }
}

/**
 * Handler GET untuk detail subscription admin.
 */
export async function getAdminSubscriptionApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const { id } = await params;
        const sub = await SubscriptionClient.findSiteById(id);
        return apiResponse(sub);
    } catch (error) {
        console.error("Admin Subscription Error:", error);
        return apiError("Failed to fetch subscription");
    }
}

/**
 * Handler PUT untuk cancel subscription.
 */
export async function cancelSubscriptionApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(undefined, { requireSite: false });
        if (error) return apiError(error, status);

        const body = await req.json();
        const { subscriptionId } = body;
        if (!subscriptionId) return apiError("subscriptionId is required", 400);

        const result = await SubscriptionClient.cancelSubscription(subscriptionId);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[CANCEL_SUBSCRIPTION_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}

/**
 * Handler POST untuk extend trial (admin).
 */
export async function extendTrialApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);
        const userId = session?.user?.id || "";
        const userRole = (session?.user as any)?.role || "";

        const body = await req.json();
        const { siteId } = body;
        if (!siteId) return apiError("siteId is required", 400);

        const result = await SubscriptionClient.extendTrial(userId, userRole, siteId);
        return apiResponse(result);
    } catch (error: any) {
        console.error("[EXTEND_TRIAL_ERROR]", error);
        return apiError(error.message || "Internal Error");
    }
}

/**
 * Handler GET untuk memproses cron job pemeriksaan status langganan.
 */
export async function updateSubscriptionByAdminApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        if (action === "extend") {
            const days = body.days || 7;
            const result = await SubscriptionClient.extendSubscription(id, days);
            return apiResponse(result);
        }

        if (action === "cancel") {
            const result = await SubscriptionClient.cancelSubscription(id);
            return apiResponse(result);
        }

        if (action === "update_plan") {
            const { planId } = body;
            if (!planId) return apiError("Plan ID is required", 400);
            const result = await SubscriptionClient.updateSubscriptionPlan(id, planId);
            return apiResponse(result);
        }

        if (action === "followup") {
            const { phone, message } = body;
            if (!phone || !message) return apiError("Phone and message are required", 400);
            const { sendWhatsAppNotification } = await import("@/lib/services/whatsapp");
            const result = await sendWhatsAppNotification(phone, message);
            if (!result.success) return apiError(result.error || "Failed to send WhatsApp", 500);
            return apiResponse({ success: true, message: "WhatsApp sent", result: result.result });
        }

        if (action === "followup_email") {
            const { email, message } = body;
            if (!email || !message) return apiError("Email and message are required", 400);
            const sub = await SubscriptionClient.findSiteById(id);
            const siteOwner = (sub as any)?.users?.[0];
            const userName = siteOwner?.name || "Pengguna";
            const { sendFollowupEmail } = await import("@/modules/notification/services/email-templates.service");
            const result = await sendFollowupEmail({ toEmail: email, userName, subject: "Pesan Penting Terkait Layanan Website Anda di SitusBisnis", message });
            if (!result.success) return apiError(result.error || "Failed to send email", 500);
            return apiResponse({ success: true, message: "Email sent", result: result.id });
        }

        return apiError("Invalid action", 400);
    } catch (err) {
        console.error("Subscription Action Error:", err);
        return apiError("Internal server error");
    }
}

export async function checkSubscriptionsCronApi(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
        console.warn("[CRON] CRON_SECRET not configured — skipping auth check");
    } else if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await SubscriptionClient.checkAndUpdateExpiredSubscriptions();
        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        console.error("[CRON] check-subscriptions failed:", error);
        return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
    }
}
