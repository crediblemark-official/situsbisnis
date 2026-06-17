import { SubscriptionClient } from "@/modules/subscription"
import { followupWhatsApp, followupEmail } from "@/modules/notification";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { Role } from "@prisma/client";
import { validateCsrf } from "@/modules/shared/utils/csrf";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { session: _session, error, status } = await getApiContext([Role.admin]);
    if (error) return apiError(error, status);

    const csrf = validateCsrf(req);
    if (!csrf.valid) {
        return apiError("CSRF validation failed", 403);
    }

    try {
        const body = await req.json();
        const { action } = body;

        const sub = await SubscriptionClient.getSubscriptionDetail(id);
        if (!sub) return apiError("Subscription not found", 404);

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
            if (!phone || !message) {
                return apiError("Phone and message are required for followup", 400);
            }

            const result = await followupWhatsApp(phone, message);
            return apiResponse(result);
        }

        if (action === "followup_email") {
            const { email, message } = body;
            if (!email || !message) {
                return apiError("Email and message are required for email followup", 400);
            }

            const result = await followupEmail(email, message, sub.siteId);
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

