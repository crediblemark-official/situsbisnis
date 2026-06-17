import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { OrderClient } from "@/modules/order";
import { SubscriptionClient } from "@/modules/subscription";
import { validateCsrf } from "@/modules/shared/utils/csrf";
import { z as _z } from "zod";
import zod from "zod";
const z: typeof _z = _z || (zod as any).z || zod;

const orderSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number()
    })),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    paymentMethod: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return apiError("CSRF validation failed", 403);
        }

        const { session, siteId: ctxSiteId, error: authError, status: authStatus } = await getApiContext(undefined, { isPublic: true });
        if (authError) return apiError(authError, authStatus);

        const finalSiteId = ctxSiteId;
        if (!finalSiteId) return apiError("Site context required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, orderSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { items, name, email, address, city, zip, phone, paymentMethod } = data;

        const sessionCustomer = session?.user ? { name: session.user.name, email: session.user.email } : undefined;

        const result = await OrderClient.createOrder(
            finalSiteId,
            items,
            { name, email, address, city, zip, phone, paymentMethod },
            sessionCustomer
        );

        return apiResponse(result);
    } catch (error: any) {
        console.error("[CreateOrder]", error);
        if (error.message === "Email is required") {
            return apiError("Email is required", 400);
        }
        if (error.message.includes("Product not found")) {
            return apiError(error.message, 400);
        }
        const lowerMsg = error.message.toLowerCase();
        if (lowerMsg.includes("langganan") || lowerMsg.includes("limit")) {
            return apiError(error.message, 403);
        }
        return apiError("Internal Error");
    }
}

