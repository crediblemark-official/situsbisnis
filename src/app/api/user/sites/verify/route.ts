import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IdentityClient } from "@/modules/auth";
import { apiResponse, apiError } from "@/lib/api/utils";
import { z } from "zod";

const verifySchema = z.object({
    siteId: z.string().min(1, "Site ID is required"),
    domain: z.string().min(1, "Domain is required"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !(session.user as any).id) {
            return apiError("Unauthorized", 401);
        }
        const userId = (session.user as any).id;

        const body = await req.json();
        const parsed = verifySchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { siteId, domain } = parsed.data;

        try {
            const result = await IdentityClient.verifySiteCustomDomain(userId, siteId, domain);
            return apiResponse(result);
        } catch (err: any) {
            const message = err.message;
            if (message === "Access denied") {
                return apiError("Site not found or access denied", 404);
            }
            if (message === "Upgrade required") {
                return apiError("Paket Anda tidak mendukung domain kustom.", 403);
            }
            return apiError(message, 400);
        }
    } catch (error) {
        console.error("[USER_SITES_VERIFY_POST]", error);
        return apiError("Internal Server Error");
    }
}

