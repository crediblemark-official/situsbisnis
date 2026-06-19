"use server";

import { getApiContext } from "@/lib/api/utils";
import { SubscriptionClient } from "@/modules/subscription";
import { followupWhatsApp, followupEmail } from "@/modules/notification";
import { Role } from "@prisma/client";

export async function updateAdminSettingsAction(body: any) {
    try {
        const { session, error } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const {
            siteName,
            contactEmail,
            contactPhone,
            whatsappNumber,
            footerAddress,
            allowRegistration,
            plans,
            paymentMethods,
            storage,
            paymentGateway,
            gatewayMerchantId,
            gatewayClientKey,
            gatewayApiKey,
            gatewaySandbox,
            gatewayApiType,
            aiProvider,
            aiApiKey,
            starsenderApiKey,
            starsenderDeviceKey,
            resendApiKey,
            emailSenderName,
            emailSenderAddress
        } = body;

        // Mendapatkan data admin site
        const adminSite = await SubscriptionClient.getAdminSite();

        // 1. Update Platform Branding via SubscriptionClient
        await SubscriptionClient.updateAdminSiteBranding(adminSite.id, {
            siteName,
            contactEmail,
            contactPhone,
            whatsappNumber,
            footerAddress,
            allowRegistration
        });

        // 2. Update Plans via SubscriptionClient
        if (plans && Array.isArray(plans)) {
            await SubscriptionClient.upsertPlans(plans);
        }

        // 3. Update Platform Payment Methods via SubscriptionClient
        if (paymentMethods && Array.isArray(paymentMethods)) {
            await SubscriptionClient.updateAdminPaymentMethods(adminSite.id, paymentMethods);
        }

        // 4. Update Platform Settings (Storage, Affiliate, dll.) via SubscriptionClient
        if (storage) {
            await SubscriptionClient.updatePlatformSettings({
                r2AccessKeyId: storage.accessKeyId,
                r2SecretAccessKey: storage.secretAccessKey,
                r2BucketName: storage.bucketName,
                r2PublicDomain: storage.publicDomain,
                r2Endpoint: storage.endpoint,
                affiliateCommissionRate: body.affiliateCommissionRate,
                affiliateRecurringCommission: body.affiliateRecurringCommission,
                affiliateRecurringCommissionRate: body.affiliateRecurringCommissionRate,
                paymentGateway: paymentGateway || "midtrans",
                gatewayMerchantId,
                gatewayClientKey,
                gatewayApiKey,
                gatewaySandbox: gatewaySandbox ?? true,
                gatewayApiType: gatewayApiType || "snap",
                aiProvider,
                aiApiKey,
                starsenderApiKey,
                starsenderDeviceKey,
                resendApiKey,
                emailSenderName,
                emailSenderAddress
            });
        }

        // Invalidate cached marketing pages (ISR) & data caches
        const { revalidatePath, revalidateTag } = await import("next/cache");
        revalidateTag("platform", "default");
        revalidateTag("pricing-plans", "default");
        revalidatePath("/pricing");
        revalidatePath("/about");
        revalidatePath("/contact");
        revalidatePath("/privacy");
        revalidatePath("/roadmap");

        return { success: true, message: "Settings updated" };
    } catch (e: any) {
        console.error("Update Admin Settings Error:", e);
        if (e && e.message === "ADMIN_SITE_NOT_FOUND") {
            return { success: false, error: "Platform admin site not found", status: 404 };
        }
        return { success: false, error: e.message || "Failed to update platform settings" };
    }
}

export async function fetchAIModelsAction(body: { provider: string; apiKey: string }) {
    try {
        const { error, session } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { provider, apiKey } = body;
        if (!apiKey || !apiKey.trim()) {
            return { success: true, models: [] };
        }

        const trimmedKey = apiKey.trim();
        let models: string[] = [];

        if (provider === "gemini") {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`);
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
            }
            const data = await res.json();
            if (Array.isArray(data.models)) {
                models = data.models
                    .map((m: any) => m.name.replace(/^models\//, ""))
                    .filter((name: string) => name.includes("gemini") || name.includes("text"));
            }
        } else {
            let url = "";
            if (provider === "openai") url = "https://api.openai.com/v1/models";
            else if (provider === "openrouter") url = "https://openrouter.ai/api/v1/models";
            else if (provider === "groq") url = "https://api.groq.com/openai/v1/models";
            else if (provider === "nvidia") url = "https://integrate.api.nvidia.com/v1/models";
            else url = "https://api.openai.com/v1/models";

            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${trimmedKey}`,
                },
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`${provider} API returned status ${res.status}: ${errText}`);
            }

            const data = await res.json();
            if (Array.isArray(data.data)) {
                models = data.data.map((m: any) => m.id);
            }
        }

        // Sort models alphabetically for clean rendering
        models.sort();

        return { success: true, models };
    } catch (err: any) {
        console.error("Fetch models error:", err);
        return { success: false, error: err.message || "Failed to fetch models" };
    }
}

export async function getAllPlansAction() {
    try {
        const { error, session } = await getApiContext([Role.admin]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const plans = await SubscriptionClient.getAllPlans();
        return { success: true, result: plans };
    } catch (err: any) {
        console.error("Fetch Plans Error:", err);
        return { success: false, error: err.message || "Internal server error" };
    }
}

export async function manageSubscriptionAction(subscriptionId: string, body: any) {
    try {
        const { session, error } = await getApiContext([Role.admin]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const { action } = body;
        const sub = await SubscriptionClient.getSubscriptionDetail(subscriptionId);
        if (!sub) return { success: false, error: "Subscription not found", status: 404 };

        if (action === "extend") {
            const days = body.days || 7;
            const result = await SubscriptionClient.extendSubscription(subscriptionId, days);
            return { success: true, result };
        }

        if (action === "cancel") {
            const result = await SubscriptionClient.cancelSubscription(subscriptionId);
            return { success: true, result };
        }

        if (action === "update_plan") {
            const { planId } = body;
            if (!planId) return { success: false, error: "Plan ID is required", status: 400 };

            const result = await SubscriptionClient.updateSubscriptionPlan(subscriptionId, planId);
            return { success: true, result };
        }

        if (action === "followup") {
            const { phone, message } = body;
            if (!phone || !message) {
                return { success: false, error: "Phone and message are required for followup", status: 400 };
            }

            const result = await followupWhatsApp(phone, message);
            return { success: true, result };
        }

        if (action === "followup_email") {
            const { email, message } = body;
            if (!email || !message) {
                return { success: false, error: "Email and message are required for email followup", status: 400 };
            }

            const result = await followupEmail(email, message, sub.siteId);
            return { success: true, result };
        }

        return { success: false, error: "Invalid action", status: 400 };
    } catch (err: any) {
        console.error("Subscription Action Error:", err);
        if (err.message === "NOT_FOUND") {
            return { success: false, error: "Subscription not found", status: 404 };
        }
        return { success: false, error: err.message || "Internal server error" };
    }
}
