import { NextResponse } from "next/server";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { getPaymentSettings } from "@/lib/settings/payment";
import { getSiteId } from "@/lib/domains/tenant";
import { z } from "zod";
import { FinancialClient } from "@/modules/financial";
import { SiteClient } from "../index";
import { SubscriptionClient } from "@/modules/subscription";
import { createLogger } from "@/lib/core/logger";

const healthLogger = createLogger("health");

async function checkDatabase(): Promise<boolean> {
  try {
    return await SiteClient.pingDatabase();
  } catch (error) {
    healthLogger.error({ error }, "Database health check failed");
    return false;
  }
}

async function checkStorage(): Promise<boolean> {
  try {
    const settings = await SubscriptionClient.getPlatformSettings();

    const hasR2Config = !!(
      settings &&
      settings.r2AccountId &&
      settings.r2AccessKeyId &&
      settings.r2SecretAccessKey &&
      settings.r2BucketName
    );
    return hasR2Config;
  } catch (error) {
    healthLogger.error({ error }, "Storage settings health check failed");
    return false;
  }
}

const contactFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().optional().default("No Subject"),
    message: z.string().min(1, "Message is required"),
    emailTo: z.string().email("Invalid destination email").optional(),
});

/**
 * Handler GET untuk settings.
 */
export async function getSettingsApi() {
    try {
        const { session, siteId } = await getApiContext(undefined, { requireSite: false, isPublic: true });
        const settings = await SiteClient.getSiteSettings(siteId || undefined);

        if (session && siteId) {
            const [domainInfo, billingContext] = await Promise.all([
                SiteClient.getSiteDomainInfo(siteId),
                FinancialClient.getSiteSettingsBillingContext(siteId)
            ]);

            return apiResponse({ 
                ...settings, 
                customDomain: domainInfo?.customDomain,
                customDomainVerified: domainInfo?.customDomainVerified,
                plan: billingContext.activePlanName,
                isTrial: billingContext.isTrial,
                trialEndsAt: billingContext.trialEndsAt,
                planPrice: billingContext.activePlanPrice,
                allPlans: billingContext.allPlans,
                planFeatures: billingContext.planFeatures,
                maxSites: billingContext.maxSites
            });
        }

        return apiResponse(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return apiError("Failed to fetch settings");
    }
}

/**
 * Handler GET untuk payment settings.
 */
export async function getPaymentSettingsApi() {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const settings = await getPaymentSettings(siteId);
        return apiResponse(settings || {});
    } catch (_error) {
        return apiError("Failed to fetch settings");
    }
}

/**
 * Handler GET untuk site analytics.
 */
export async function getAnalyticsApi() {
    try {
        const siteId = await getSiteId();
        if (!siteId) return apiResponse({ totalViews: 0, todayViews: 0 });

        const stats = await SiteClient.getOrIncrementViews(siteId);

        return apiResponse(stats);
    } catch (error) {
        console.error("Analytics Route Error:", error);
        return apiError("Internal Error");
    }
}

/**
 * Handler GET untuk health check.
 */
export async function getHealthApi() {
  const globalAny = globalThis as any;
  if (typeof globalAny.Bun !== "undefined" && typeof globalAny.Bun.gc === "function") {
    globalAny.Bun.gc(true);
  }

  const [dbHealthy, storageHealthy] = await Promise.all([
    checkDatabase(),
    checkStorage(),
  ]);

  const isHealthy = dbHealthy;
  const statusCode = isHealthy ? 200 : 503;

  if (!isHealthy) {
    healthLogger.error({ db: dbHealthy }, "Critical database health check failed");
  } else if (!storageHealthy) {
    healthLogger.info({ storage: false }, "Storage (R2) is not configured");
  }

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      checks: {
        database: dbHealthy ? "healthy" : "unhealthy",
        storage: storageHealthy ? "configured" : "not-configured",
      },
    },
    { status: statusCode }
  );
}

/**
 * Handler POST untuk contact submission.
 */
export async function postContactApi(req: Request) {
    try {
        const siteId = await getSiteId();
        if (!siteId) {
            return apiError("Site context required", 400);
        }
        
        const { data, error, details, status } = await validateBody(req, contactFormSchema);
        if (error) return apiError(error, status, details);

        const { emailTo: _emailTo, ...submissionData } = data;

        await SiteClient.createContactSubmission(siteId, submissionData);

        return apiResponse({ success: true, message: "Message sent successfully" });
    } catch (error) {
        console.error("Contact Form Error:", error);
        return apiError("Internal Error");
    }
}

/**
 * Handler GET untuk mengambil contact submissions.
 */
export async function getContactApi(_req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const submissions = await SiteClient.getContactSubmissions(siteId);
        return apiResponse(submissions);
    } catch (error) {
        console.error("Fetch Submissions Error:", error);
        return apiError("Internal Error");
    }
}
