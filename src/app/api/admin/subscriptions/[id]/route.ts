import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";
import { sendWhatsAppNotification } from "@/lib/services/whatsapp";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { session: _session, error, status } = await getApiContext([Role.admin]);
    if (error) return apiError(error, status);

    try {
        const body = await req.json();
        const { action } = body;

        const sub = await db.subscription.findUnique({
            where: { id },
            include: { plan: true }
        });

        if (!sub) return apiError("Subscription not found", 404);

        const site = await db.site.findUnique({
            where: { id: sub.siteId }
        });

        const { IdentityClient } = await import("@/modules/auth");
        const siteOwner = site ? await IdentityClient.getSiteOwner(site.id) : null;

        if (action === "extend") {
            const days = body.days || 7;
            let updateData: any = {
                status: "active"
            };
            
            // If the current plan is "Free", upgrade them to "Pro" for the extension period
            if (sub.plan.name.toLowerCase() === "free") {
                const proPlan = await db.plan.findFirst({
                    where: { name: { equals: "Pro", mode: "insensitive" } }
                });
                
                if (proPlan) {
                    updateData.planId = proPlan.id;
                }
                
                // For Free -> Pro upgrade, we always set an endDate from now
                updateData.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                updateData.trialEndsAt = null; // Clear trial if upgrading
            } else {
                // For existing paid plans, extend current limit
                if (sub.endDate) {
                    const currentEnd = new Date(sub.endDate);
                    updateData.endDate = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
                } else if (sub.trialEndsAt) {
                    const currentTrial = new Date(sub.trialEndsAt);
                    updateData.trialEndsAt = new Date(currentTrial.getTime() + days * 24 * 60 * 60 * 1000);
                } else {
                    updateData.endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
                }
            }

            const updated = await db.subscription.update({
                where: { id },
                data: updateData,
                include: { plan: true }
            });

            return apiResponse({ 
                success: true, 
                message: `Subscription extended by ${days} days`,
                newEndDate: updated.endDate || updated.trialEndsAt,
                newPlan: updated.plan.name,
                newPlanObj: {
                    id: updated.plan.id,
                    name: updated.plan.name,
                    price: updated.plan.price,
                    maxSites: updated.plan.maxSites,
                    maxPosts: updated.plan.maxPosts,
                    maxProducts: updated.plan.maxProducts,
                    addonSiteBilling: updated.plan.addonSiteBilling,
                    features: updated.plan.features
                }
            });
        }

        if (action === "cancel") {
            await db.subscription.update({
                where: { id },
                data: { status: "cancelled" }
            });

            // Trigger cancellation email in background
            if (siteOwner && siteOwner.email) {
                const { sendSubscriptionCancelledEmail } = await import("@/lib/services/email");
                sendSubscriptionCancelledEmail({
                    toEmail: siteOwner.email,
                    userName: siteOwner.name || "Pengguna",
                    siteName: site?.name || "Situs",
                    planName: sub.plan.name
                }).catch(err => {
                    console.error("[CANCEL_EMAIL_ERROR] Failed to send email:", err);
                });
            }

            return apiResponse({ success: true, message: "Subscription cancelled" });
        }

        if (action === "update_plan") {
            const { planId } = body;
            if (!planId) return apiError("Plan ID is required", 400);

            const updated = await db.subscription.update({
                where: { id },
                data: { 
                    planId,
                    status: "active" // Reactivate if it was cancelled/expired
                },
                include: { plan: true }
            });

            return apiResponse({ 
                success: true, 
                message: "Plan updated successfully",
                newPlan: updated.plan.name
            });
        }

        if (action === "followup") {
            const { phone, message } = body;
            if (!phone || !message) {
                return apiError("Phone and message are required for followup", 400);
            }

            const result = await sendWhatsAppNotification(phone, message);
            if (!result.success) {
                return apiError(result.error || "Failed to send WhatsApp follow-up", 500);
            }

            return apiResponse({ success: true, message: "WhatsApp follow-up sent successfully", result: result.result });
        }

        if (action === "followup_email") {
            const { email, message } = body;
            if (!email || !message) {
                return apiError("Email and message are required for email followup", 400);
            }

            const userName = siteOwner?.name || "Pengguna";

            const { sendFollowupEmail } = await import("@/lib/services/email");
            const result = await sendFollowupEmail({
                toEmail: email,
                userName,
                subject: `Pesan Penting Terkait Layanan Website Anda di SitusBisnis`,
                message
            });

            if (!result.success) {
                return apiError(result.error || "Failed to send email follow-up", 500);
            }

            return apiResponse({ success: true, message: "Email follow-up sent successfully", result: result.id });
        }

        return apiError("Invalid action", 400);
    } catch (err) {
        console.error("Subscription Action Error:", err);
        return apiError("Internal server error");
    }
}
