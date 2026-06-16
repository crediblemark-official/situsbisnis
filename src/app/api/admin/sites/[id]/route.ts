import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session: _session, error, status } = await getApiContext(["admin"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("Site ID required", 400);

        const site = await db.site.findUnique({ where: { id } });
        if (!site) return apiError("Site not found", 404);

        if (site.subdomain === "admin") {
            return apiError("Cannot delete the platform admin site", 400);
        }

        // Delete all OrderItems belonging to the site's orders first to satisfy foreign key RESTRICT constraints
        await db.orderItem.deleteMany({
            where: {
                order: {
                    siteId: id
                }
            }
        });

        await db.site.delete({ where: { id } });

        return apiResponse({ success: true, message: "Site deleted successfully" });
    } catch (e) {
        console.error("Delete Site Error:", e);
        return apiError("Failed to delete site");
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session: _session, error, status } = await getApiContext(["admin"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        const site = await db.site.findUnique({ 
            where: { id }
        });
        if (!site) return apiError("Site not found", 404);

        if (action === "set_free") {
            const freePlan = await db.plan.findFirst({ where: { name: { contains: "Free", mode: "insensitive" } } });
            if (!freePlan) return apiError("Free plan not found in database", 404);

            // Deactivate all previous active subscriptions
            await db.subscription.updateMany({
                where: { siteId: id, status: "active" },
                data: { status: "cancelled" }
            });

            await db.subscription.create({
                data: {
                    siteId: id,
                    planId: freePlan.id,
                    status: "active",
                    trialEndsAt: null, // Free plan has no trial
                }
            });

            // Invalidate cache
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${id}`, "default");

            return apiResponse({ success: true, message: "Site set to Free plan" });
        }

        if (action === "extend_trial") {
            const sub = await db.subscription.findFirst({
                where: { siteId: id },
                orderBy: { createdAt: "desc" }
            });
            if (!sub) return apiError("No subscription found", 404);
            if (sub.trialExtended) return apiError("Trial already extended", 400);
            if (!sub.trialEndsAt) return apiError("This is not a trial subscription", 400);

            const newEndDate = new Date(sub.trialEndsAt);
            newEndDate.setDate(newEndDate.getDate() + 7);

            await db.subscription.update({
                where: { id: sub.id },
                data: {
                    trialEndsAt: newEndDate,
                    trialExtended: true
                }
            });

            // Invalidate cache
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${id}`, "default");

            // Send email notification in background
            const siteOwner = await db.user.findFirst({
                where: { sites: { some: { id } } }
            });

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
                    siteName: site.name,
                    days: 7,
                    newEndDate: formattedEndDate
                }).catch(err => {
                    console.error("[EXTEND_TRIAL_EMAIL_ERROR] Failed to send email:", err);
                });
            }

            return apiResponse({ success: true, message: "Trial extended by 7 days" });
        }

        return apiError("Invalid action", 400);
    } catch (e) {
        console.error("Patch Site Error:", e);
        return apiError("Failed to update site");
    }
}
