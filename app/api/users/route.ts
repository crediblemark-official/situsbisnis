import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import bcrypt from "bcryptjs";
import { z as _z } from "zod";
import zod from "zod";
const z: typeof _z = _z || (zod as any).z || zod;
import { Role } from "@prisma/client";

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



        // Check if we are in a tenant subsite context (subdomain !== 'admin')
        const { getTenant } = await import("@/lib/domains/tenant");
        const tenant = await getTenant();
        const isTenantContext = !!siteId && tenant !== null && tenant !== "admin";

        let rawUsers;
        if (session.user.role === "admin" && !isTenantContext) {
            rawUsers = await db.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    image: true,
                    createdAt: true
                }
            });
        } else {
            rawUsers = await db.user.findMany({
                where: {
                    sites: {
                        some: { id: siteId }
                    },
                    role: { not: "admin" }
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    image: true,
                    createdAt: true
                }
            });
        }

        // Ambil jumlah postingan (posts) per pengguna secara terpisah menggunakan groupBy
        const postCounts = await db.post.groupBy({
            by: ["authorId"],
            _count: {
                id: true
            },
            where: {
                ...(isTenantContext ? { siteId } : {}),
                published: true
            }
        });

        const postCountMap = new Map(postCounts.map(pc => [pc.authorId, pc._count.id]));

        const users = rawUsers.map(user => ({
            ...user,
            _count: {
                posts: postCountMap.get(user.id) || 0
            }
        }));

        return apiResponse({ users });
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

        const { name, email, role } = data;

        // Security: Only platform admins can assign the admin role
        if (role === "admin" && session?.user?.role !== "admin") {
            return apiError("Forbidden: Only platform admins can assign the admin role", 403);
        }

        let user = await db.user.findUnique({
            where: { email }
        });

        if (user) {
            if (siteId) {
                await db.site.update({
                    where: { id: siteId },
                    data: {
                        users: {
                            connect: { id: user.id }
                        }
                    }
                });
            }
        } else {
            const hashedPassword = await bcrypt.hash("change-me", 10);
            user = await db.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: (role as Role) || Role.user,
                    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
                    sites: siteId ? {
                        connect: { id: siteId }
                    } : undefined
                }
            });
        }

        return apiResponse({ success: true, user });
    } catch (error) {
        console.error("Create User Error:", error);
        return apiError("Failed to create user");
    }
}
