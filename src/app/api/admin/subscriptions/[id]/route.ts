import { BillingClient } from "@/modules/billing";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";

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

        const sub = await BillingClient.getSubscriptionDetail(id);
        if (!sub) return apiError("Subscription not found", 404);

        if (action === "extend") {
            const days = body.days || 7;
            const result = await BillingClient.extendSubscription(id, days);
            return apiResponse(result);
        }

        if (action === "cancel") {
            const result = await BillingClient.cancelSubscription(id);
            return apiResponse(result);
        }

        if (action === "update_plan") {
            const { planId } = body;
            if (!planId) return apiError("Plan ID is required", 400);

            const result = await BillingClient.updateSubscriptionPlan(id, planId);
            return apiResponse(result);
        }

        if (action === "followup") {
            const { phone, message } = body;
            if (!phone || !message) {
                return apiError("Phone and message are required for followup", 400);
            }

            const result = await BillingClient.followupWhatsApp(phone, message);
            return apiResponse(result);
        }

        if (action === "followup_email") {
            const { email, message } = body;
            if (!email || !message) {
                return apiError("Email and message are required for email followup", 400);
            }

            const result = await BillingClient.followupEmail(email, message, sub.siteId);
            return apiResponse(result);
        }

        return apiError("Invalid action", 400);
    } catch (err: any) {
        console.error("Subscription Action Error:", err);
        if (err.message === "NOT_FOUND") {
            return apiError("Subscription not found", 404);
        }
        return apiError("Internal server error");
    }
}

