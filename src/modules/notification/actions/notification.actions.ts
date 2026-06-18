"use server";

import { getApiContext } from "@/lib/api/utils";
import { sendFollowupEmail } from "../services/email-templates.service";

export async function sendFollowupEmailAction(email: string, subject: string, message: string) {
    try {
        const { error, session } = await getApiContext(["admin"], { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const result = await sendFollowupEmail({ toEmail: email, userName: "Pengguna", subject, message });
        if (!result.success) return { success: false, error: result.error || "Gagal mengirim email" };
        return { success: true, message: "Email berhasil dikirim", id: result.id };
    } catch (err: any) {
        return { success: false, error: err.message || "Internal server error" };
    }
}
