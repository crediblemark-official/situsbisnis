
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IdentityClient } from "@/modules/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCsrf } from "@/modules/shared/utils/csrf";

const profileUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
});

export async function PUT(req: Request) {
    try {
        const csrf = validateCsrf(req);
        if (!csrf.valid) {
            return new NextResponse("CSRF validation failed", { status: 403 });
        }

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

        try {
            await IdentityClient.updateUserProfile(session.user.email, validation.data);
            return NextResponse.json({ success: true, message: "Profile updated successfully" });
        } catch (err: any) {
            const message = err.message;
            if (message === "User not found") {
                return new NextResponse("User not found", { status: 404 });
            }
            if (message === "Current password required" || message === "Incorrect current password") {
                return NextResponse.json({ error: message }, { status: 400 });
            }
            throw err;
        }
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

