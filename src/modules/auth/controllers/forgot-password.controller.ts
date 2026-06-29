import { apiResponse, apiError } from "@/lib/api/utils";
import { db } from "@/lib/core/db";
import { sendEmail } from "@/modules/notification/services/email.service";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const forgotPasswordSchema = z.object({
    email: z.string().email("Format email tidak valid"),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token wajib diisi"),
    password: z.string().min(8, "Password baru minimal 8 karakter"),
});

/**
 * Memproses permintaan lupa password dengan membuat token acak,
 * menyimpannya ke DB, dan mengirimkan link reset ke email user.
 */
export async function forgotPasswordApi(req: Request) {
    try {
        const body = await req.json();
        const parsed = forgotPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validasi gagal", 400, parsed.error.format());
        }

        const { email } = parsed.data;

        // 1. Cari user di database
        const user = await db.user.findUnique({
            where: { email },
        });

        // Pengamanan: Jangan bocorkan apakah email terdaftar atau tidak
        if (!user) {
            return apiResponse({
                success: true,
                message: "Tautan atur ulang kata sandi telah dikirim ke email Anda jika terdaftar.",
            });
        }

        // 2. Hapus token reset lama jika ada untuk email ini
        await db.passwordResetToken.deleteMany({
            where: { email },
        });

        // 3. Buat token reset baru
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam dari sekarang

        await db.passwordResetToken.create({
            data: {
                email,
                token,
                expires,
            },
        });

        // 4. Susun link reset password
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetLink = `${appUrl}/reset-password?token=${token}`;

        // 5. Kirim email reset password
        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: bold;">Atur Ulang Kata Sandi</h2>
                    <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">Sistem Aman SitusBisnis</p>
                </div>
                <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-top: 0;">Halo,</p>
                    <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Klik tombol di bawah ini untuk melanjutkan proses:</p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetLink}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block;">
                            Atur Ulang Kata Sandi
                        </a>
                    </div>
                    
                    <p style="font-size: 13px; line-height: 1.5; color: #94a3b8; margin-bottom: 0;">Tautan ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa meminta perubahan ini, Anda dapat mengabaikan email ini dengan aman.</p>
                </div>
                <div style="text-align: center; font-size: 11px; color: #64748b;">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} SitusBisnis. All rights reserved.</p>
                </div>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: "Atur Ulang Kata Sandi Akun Anda",
            html: emailHtml,
        });

        return apiResponse({
            success: true,
            message: "Tautan atur ulang kata sandi telah dikirim ke email Anda jika terdaftar.",
        });
    } catch (error: any) {
        console.error("[FORGOT_PASSWORD_API] Error:", error);
        return apiError("Gagal memproses permintaan lupa password", 500);
    }
}

/**
 * Mengatur ulang password user setelah memvalidasi token yang dikirimkan.
 */
export async function resetPasswordApi(req: Request) {
    try {
        const body = await req.json();
        const parsed = resetPasswordSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validasi gagal", 400, parsed.error.format());
        }

        const { token, password } = parsed.data;

        // 1. Cari token reset di DB
        const resetTokenRecord = await db.passwordResetToken.findUnique({
            where: { token },
        });

        // 2. Validasi token & masa aktifnya
        if (!resetTokenRecord || resetTokenRecord.expires < new Date()) {
            return apiError("Tautan reset tidak valid atau telah kedaluwarsa", 400);
        }

        const { email } = resetTokenRecord;

        // 3. Hash password baru
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Update password user di DB
        await db.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        // 5. Hapus token agar tidak bisa digunakan kembali
        await db.passwordResetToken.delete({
            where: { token },
        });

        return apiResponse({
            success: true,
            message: "Kata sandi Anda telah berhasil diatur ulang.",
        });
    } catch (error: any) {
        console.error("[RESET_PASSWORD_API] Error:", error);
        return apiError("Gagal mengatur ulang kata sandi", 500);
    }
}
