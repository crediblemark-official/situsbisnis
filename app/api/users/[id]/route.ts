import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import bcrypt from "bcryptjs";
import { userSchema } from "@/app/api/users/route";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, error, status } = await getApiContext(["admin", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("User ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, userSchema.partial());
        if (vError) return apiError(vError, vStatus, details);

        const { role, name, email, password } = data;

        const targetUser = await db.user.findUnique({ where: { id } });
        if (!targetUser) return apiError("User not found", 404);

        if (session.user.role !== "admin") {
            const belongs = await db.user.findFirst({
                where: { 
                    id,
                    sites: { some: { id: siteId } }
                }
            });
            if (!belongs) return apiError("User not found in this site context", 404);

            // Security: Non-admins cannot modify platform admin users
            if (targetUser.role === "admin") {
                return apiError("Forbidden: Cannot modify a platform admin", 403);
            }

            // Security: Non-admins cannot promote anyone to admin
            if (role === "admin") {
                return apiError("Forbidden: Only platform admins can assign the admin role", 403);
            }
        }

        const updateData: any = {};
        if (role) updateData.role = role;
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password && password.trim() !== "") {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await db.user.update({
            where: { id },
            data: updateData
        });

        return apiResponse({ success: true });
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

        if (id === session.user.id) {
            return apiError("Cannot delete yourself", 400);
        }

        // Check if we are in a tenant subsite context (subdomain !== 'admin')
        const { getTenant } = await import("@/lib/domains/tenant");
        const tenant = await getTenant();
        const isTenantContext = !!siteId && tenant !== null && tenant !== "admin";

        if (session.user.role !== "admin" || isTenantContext) {
            const belongs = await db.user.findFirst({
                where: { 
                    id,
                    sites: { some: { id: siteId } }
                }
            });
            if (!belongs) return apiError("User not found in this site context", 404);
            
            await db.site.update({
                where: { id: siteId },
                data: {
                    users: {
                        disconnect: { id }
                    }
                }
            });
            return apiResponse({ success: true, message: "User removed from site" });
        }

        await db.post.deleteMany({ where: { authorId: id } });
        await db.user.delete({ where: { id } });

        return apiResponse({ success: true });
    } catch (e) {
        console.error("Delete User Error:", e);
        return apiError("Failed to delete user");
    }
}
