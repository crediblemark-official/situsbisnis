import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { getPaymentSettings } from "@/lib/settings/payment";
import { TenantClient } from "@/modules/tenant";
import { z } from "zod";

const paymentSchema = z.object({
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    accountHolder: z.string().optional(),
    instructions: z.string().optional(),
    currency: z.string().optional(),
});

/**
 * GET /api/settings/payments
 * Mengambil pengaturan pembayaran situs.
 */
export async function GET() {
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
 * POST /api/settings/payments
 * Menyimpan pengaturan pembayaran situs.
 */
export async function POST(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, paymentSchema);
        if (vError) return apiError(vError, vStatus, details);

        await TenantClient.savePaymentSettings(siteId, data);

        return apiResponse({ success: true });
    } catch (error) {
        console.error("Payment settings error:", error);
        return apiError("Failed to save settings");
    }
}
