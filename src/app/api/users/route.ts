import { IdentityClient } from "@/modules/auth";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { z as _z } from "zod";
import zod from "zod";
const z: typeof _z = _z || (zod as any).z || zod;

export const userSchema = z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    role: z.string().optional().default("user"),
    password: z.string().optional(),
    userId: z.string().optional(),
});

export async function GET() {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
        if (error) return apiError(error, status);

        const { getTenant } = await import("@/lib/domains/tenant");
        const tenant = await getTenant();
        const isTenantContext = !!siteId && tenant !== null && tenant !== "admin";

        try {
            const { users } = await IdentityClient.getUsers(session.user.role, isTenantContext, siteId);
            return apiResponse({ users });
        } catch (err: any) {
            return apiError(err.message || "Failed to fetch users");
        }
    } catch (error) {
        console.error("Fetch Users Error:", error);
        return apiError("Failed to fetch users");
    }
}

export async function POST(req: Request) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, userSchema);
        if (vError) return apiError(vError, vStatus, details);

        try {
            const user = await IdentityClient.createUserByAdmin(siteId, data, session.user.role);
            return apiResponse({ success: true, user });
        } catch (err: any) {
            const message = err.message;
            if (message.startsWith("Forbidden")) {
                return apiError(message, 403);
            }
            throw err;
        }
    } catch (error) {
        console.error("Create User Error:", error);
        return apiError("Failed to create user");
    }
}

