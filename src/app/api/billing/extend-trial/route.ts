import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function POST(req: Request) {
    try {
        const { session, error, status } = await getApiContext(["owner", "admin"]);
        if (error) return apiError(error, status);

        const body = await req.json();
        const { siteId } = body;

        if (!siteId) return apiError("Site ID required", 400);

        // Verify that the logged-in user belongs to the site (or is admin)
        const site = await db.site.findUnique({
            where: { id: siteId }
        });

        if (!site) {
            return apiError("Site not found", 404);
        }

        const isAdmin = (session as any).user.role === "admin";
        if (!isAdmin) {
            const { TenantClient } = await import("@/modules/tenant");
            const hasAccess = await TenantClient.verifyUserSiteAccess((session as any).user.id, siteId);
            if (!hasAccess) {
                return apiError("Forbidden", 403);
            }
        }

        const sub = await db.subscription.findFirst({
            where: { siteId },
            orderBy: { createdAt: "desc" }
        });

        if (!sub) return apiError("No subscription found", 404);
        if (sub.trialExtended) return apiError("Trial already extended", 400);
        if (!sub.trialEndsAt) return apiError("This is not a trial subscription", 400);

        // Standard extension is 7 days
        const newEndDate = new Date(sub.trialEndsAt);
        newEndDate.setDate(newEndDate.getDate() + 7);

        await db.subscription.update({
            where: { id: sub.id },
            data: {
                trialEndsAt: newEndDate,
                trialExtended: true
            }
        });

        // Invalidate Next.js subscription cache
        const { revalidateTag } = await import("next/cache");
        revalidateTag(`site-${siteId}`, "default");

        // Send email notification in background
        const { IdentityClient } = await import("@/modules/auth");
        const siteOwner = await IdentityClient.getSiteOwner(siteId);

        if (siteOwner && siteOwner.email) {
            const { sendTrialExtendedEmail } = await import("@/lib/services/email");
            const formattedEndDate = newEndDate.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
            sendTrialExtendedEmail({
                toEmail: siteOwner.email,
                userName: siteOwner.name || "Pengguna",
                siteName: site?.name || "Website Anda",
                days: 7,
                newEndDate: formattedEndDate
            }).catch(err => {
                console.error("[EXTEND_TRIAL_EMAIL_ERROR] Failed to send email:", err);
            });
        }

        return apiResponse({ 
            success: true, 
            message: "Trial extended successfully by 7 days." 
        });
    } catch (e) {
        console.error("Extend Trial Error:", e);
        return apiError("Failed to extend trial");
    }
}
