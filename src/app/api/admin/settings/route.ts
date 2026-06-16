import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

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

        // We target the 'admin' subdomain site for platform settings
        const adminSite = await db.site.findUnique({
            where: { subdomain: "admin" }
        });

        if (!adminSite) return apiError("Platform admin site not found", 404);

        // 1. Update Platform Branding
        await db.site.update({
            where: { id: adminSite.id },
            data: {
                name: siteName,
                siteSettings: {
                    upsert: {
                        create: { siteName, contactEmail, contactPhone, whatsappNumber, footerAddress, allowRegistration } as any,
                        update: { siteName, contactEmail, contactPhone, whatsappNumber, footerAddress, allowRegistration } as any
                    }
                }
            }
        });

        // 2. Update Plans
        if (plans && Array.isArray(plans)) {
            for (const _plan of plans) {
                const planData = {
                    name: _plan.name,
                    description: _plan.description,
                    price: _plan.price,
                    priceYearly: _plan.priceYearly,
                    originalPrice: _plan.originalPrice,
                    originalPriceYearly: _plan.originalPriceYearly,
                    trialDays: parseInt(_plan.trialDays) || 0,
                    maxPosts: isNaN(parseInt(_plan.maxPosts)) ? -1 : parseInt(_plan.maxPosts),
                    maxProducts: isNaN(parseInt(_plan.maxProducts)) ? -1 : parseInt(_plan.maxProducts),
                    maxAssets: isNaN(parseInt(_plan.maxAssets)) ? -1 : parseInt(_plan.maxAssets),
                    maxTestimonials: isNaN(parseInt(_plan.maxTestimonials)) ? -1 : parseInt(_plan.maxTestimonials),
                    maxOrders: isNaN(parseInt(_plan.maxOrders)) ? -1 : parseInt(_plan.maxOrders),
                    maxSites: isNaN(parseInt(_plan.maxSites)) ? 1 : parseInt(_plan.maxSites),
                    addonSiteBilling: _plan.addonSiteBilling,
                    showInPricing: _plan.showInPricing ?? true,
                    features: {
                        hasBlog: _plan.hasBlog ?? false,
                        hasGallery: _plan.hasGallery ?? false,
                        hasOrders: _plan.hasOrders ?? false,
                        hasCart: _plan.hasCart ?? false,
                        hasCustomDomain: _plan.hasCustomDomain ?? false,
                        hasProducts: _plan.hasProducts ?? false,
                        hasPortfolio: _plan.hasPortfolio ?? false,
                        hasTaxonomies: _plan.hasTaxonomies ?? false,
                        hasTestimonials: _plan.hasTestimonials ?? false,
                        hasInbox: _plan.hasInbox ?? false,
                        hasCustomers: _plan.hasCustomers ?? false,
                        addonSitePrice: _plan.features?.addonSitePrice || 0
                    }
                };

                if (_plan.id && !_plan.id.startsWith("new-")) {
                    await db.plan.update({
                        where: { id: _plan.id },
                        data: planData as any
                    });
                } else {
                    await db.plan.create({
                        data: planData as any
                    });
                }
            }
        }

        // 3. Update Platform Payment Methods (Manual)
        if (paymentMethods && Array.isArray(paymentMethods)) {
            // Delete all current payment settings for the admin site and recreate
            // This is the simplest way to handle dynamic additions/removals in this context
            await db.paymentSettings.deleteMany({
                where: { siteId: adminSite.id }
            });

            if (paymentMethods.length > 0) {
                await db.paymentSettings.createMany({
                    data: paymentMethods.map((pm: any) => ({
                        bankName: pm.bankName,
                        accountNumber: pm.accountNumber,
                        accountHolder: pm.accountHolder,
                        instructions: pm.instructions || "",
                        siteId: adminSite.id
                    }))
                });
            }
        }

        // 4. Update Platform Storage (R2) & Affiliate Parameters
        if (storage) {
            await db.platformSettings.upsert({
                where: { id: "global" },
                update: {
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
                    emailSenderAddress,
                },
                create: {
                    id: "global",
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
                    aiProvider: aiProvider || "gemini",
                    aiApiKey,
                    starsenderApiKey,
                    starsenderDeviceKey,
                    resendApiKey,
                    emailSenderName,
                    emailSenderAddress,
                }
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
        return apiError("Failed to update platform settings");
    }
}
