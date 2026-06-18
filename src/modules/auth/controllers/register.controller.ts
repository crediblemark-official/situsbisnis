import { apiResponse, apiError } from "@/lib/api/utils";
import { IdentityClient } from "../index";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    name: z.string().optional(),
    phone: z.string().min(8, "Nomor HP wajib diisi"),
    referralCode: z.string().optional(),
});

export async function registerApi(req: Request) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.format());
        }

        const user = await IdentityClient.registerUser(parsed.data);

        return apiResponse({
            success: true,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error: any) {
        console.error("[REGISTER_API] Error:", error);
        if (error.message?.includes("already")) {
            return apiError(error.message, 400);
        }
        return apiError("Internal Server Error", 500);
    }
}
