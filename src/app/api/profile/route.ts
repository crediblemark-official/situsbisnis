
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const profileUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
});

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        
        // Validate with Zod
        const validation = profileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ 
                error: "Validation failed", 
                details: validation.error.format() 
            }, { status: 400 });
        }

        const { name, currentPassword, newPassword } = validation.data;

        // Fetch current user with password for verification
        const currentUser = await db.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;

        // If trying to change password
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required to set a new one" }, { status: 400 });
            }

            // Verify current password if it exists (might be null if user registered via OAuth but now wants to set PWD)
            if (currentUser.password) {
                const passwordsMatch = await bcrypt.compare(currentPassword, currentUser.password);
                if (!passwordsMatch) {
                    return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
                }
            }

            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        await db.user.update({
            where: { email: session.user.email },
            data: updateData
        });

        return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
