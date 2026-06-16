import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { BillingClient } from "@/modules/billing";

// GET handler ensures Turbopack compiles this route during warm-up,
// preventing 404 cold-start race condition on PATCH requests.
export async function GET() {
    return apiError("Method Not Allowed", 405);
}

export async function PATCH(req: Request) {
    try {
        const { session: _session, error, status } = await getApiContext(["admin"]);
        if (error) return apiError(error, status);

        const body = await req.json();
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
            duitkuMerchantCode,
            duitkuApiKey,
            duitkuSandbox,
            aiProvider,
            aiApiKey,
            starsenderApiKey,
            starsenderDeviceKey,
            resendApiKey,
            emailSenderName,
            emailSenderAddress
        } = body;

        // Mendapatkan data admin site
        const adminSite = await BillingClient.getAdminSite();

        // 1. Update Platform Branding via BillingClient
        await BillingClient.updateAdminSiteBranding(adminSite.id, {
            siteName,
            contactEmail,
            contactPhone,
            whatsappNumber,
            footerAddress,
            allowRegistration
        });

        // 2. Update Plans via BillingClient
        if (plans && Array.isArray(plans)) {
            await BillingClient.upsertPlans(plans);
        }

        // 3. Update Platform Payment Methods via BillingClient
        if (paymentMethods && Array.isArray(paymentMethods)) {
            await BillingClient.updateAdminPaymentMethods(adminSite.id, paymentMethods);
        }

        // 4. Update Platform Settings (Storage, Affiliate, dll.) via BillingClient
        if (storage) {
            await BillingClient.updatePlatformSettings({
                r2AccessKeyId: storage.accessKeyId,
                r2SecretAccessKey: storage.secretAccessKey,
                r2BucketName: storage.bucketName,
                r2PublicDomain: storage.publicDomain,
                r2Endpoint: storage.endpoint,
                affiliateCommissionRate: body.affiliateCommissionRate,
                affiliateRecurringCommission: body.affiliateRecurringCommission,
                affiliateRecurringCommissionRate: body.affiliateRecurringCommissionRate,
                duitkuMerchantCode,
                duitkuApiKey,
                duitkuSandbox: duitkuSandbox ?? true,
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

        return apiResponse({ success: true, message: "Settings updated" });
    } catch (e) {
        console.error("Update Admin Settings Error:", e);
        if (e instanceof Error && e.message === "ADMIN_SITE_NOT_FOUND") {
            return apiError("Platform admin site not found", 404);
        }
        return apiError("Failed to update platform settings");
    }
}
