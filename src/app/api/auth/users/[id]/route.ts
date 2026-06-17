import { IdentityClient } from "@/modules/auth";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { userSchema } from "@/app/api/auth/users/route";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("User ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, userSchema.partial());
        if (vError) return apiError(vError, vStatus, details);

        try {
            await IdentityClient.updateUserByAdmin(id, siteId, data, session.user.id, session.user.role);
            return apiResponse({ success: true });
        } catch (err: any) {
            const message = err.message;
            if (message === "User not found") {
                return apiError("User not found", 404);
            }
            if (message === "User not found in site") {
                return apiError("User not found in this site context", 404);
            }
            if (message.startsWith("Forbidden")) {
                return apiError(message, 403);
            }
            throw err;
        }
    } catch (e) {
        console.error("Update User Error:", e);
        return apiError("Failed to update user");
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("User ID required", 400);

        try {
            const result = await IdentityClient.deleteUserByAdmin(id, siteId, session.user.id, session.user.role);
            if (result.removed) {
                return apiResponse({ success: true, message: "User removed from site" });
            }
            return apiResponse({ success: true });
        } catch (err: any) {
            const message = err.message;
            if (message === "Cannot delete yourself") {
                return apiError("Cannot delete yourself", 400);
            }
            if (message === "User not found in site") {
                return apiError("User not found in this site context", 404);
            }
            throw err;
        }
    } catch (e) {
        console.error("Delete User Error:", e);
        return apiError("Failed to delete user");
    }
}

