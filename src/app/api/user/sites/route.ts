import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IdentityClient } from "@/modules/auth";
import { apiResponse, apiError } from "@/lib/api/utils";
import { z } from "zod";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return apiError("Unauthorized", 401);

        try {
            const { sites } = await IdentityClient.getUserSites(session.user.id);
            return apiResponse({ sites });
        } catch (err: any) {
            return apiError(err.message || "Failed to fetch user sites");
        }
    } catch (error) {
        console.error("[USER_SITES_GET]", error);
        return apiError("Internal Server Error");
    }
}

const updateSiteSchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    customDomain: z.string().optional().nullable(),
});

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) return apiError("Unauthorized", 401);
        const userId = (session.user as any).id;

        const body = await req.json();
        const parsed = updateSiteSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { siteId, customDomain } = parsed.data;

        try {
            const result = await IdentityClient.updateSiteCustomDomain(userId, siteId, customDomain);
            return apiResponse(result);
        } catch (err: any) {
            const message = err.message;
            if (message === "Access denied") {
                return apiError("Site not found or access denied", 404);
            }
            if (message === "Site not found") {
                return apiError("Site not found", 404);
            }
            if (message === "Upgrade required") {
                return apiError("Paket Anda tidak mendukung domain kustom. Silakan upgrade terlebih dahulu.", 403);
            }
            return apiError(message, 400);
        }
    } catch (error) {
        console.error("[USER_SITES_PATCH]", error);
        return apiError("Internal Server Error");
    }
}

