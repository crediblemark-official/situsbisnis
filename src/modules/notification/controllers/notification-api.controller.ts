import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { sendFollowupEmail } from "../services/email-templates.service";
import { z } from "zod";

const followupSchema = z.object({
    email: z.string().email("Email tidak valid"),
    subject: z.string().min(1, "Subject wajib diisi"),
    message: z.string().min(1, "Pesan wajib diisi"),
});

export async function sendFollowupEmailApi(req: Request) {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, followupSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await sendFollowupEmail({
            toEmail: data.email,
            userName: "Pengguna",
            subject: data.subject,
            message: data.message,
        });

        if (!result.success) return apiError(result.error || "Gagal mengirim email", 500);
        return apiResponse({ success: true, message: "Email berhasil dikirim", id: result.id });
    } catch (err: any) {
        console.error("[NOTIFICATION_SEND_FOLLOWUP_API] Error:", err);
        return apiError("Internal server error");
    }
}
