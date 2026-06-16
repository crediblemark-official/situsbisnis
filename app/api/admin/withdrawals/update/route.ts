import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/core/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { withdrawalId, status } = body;

        if (!withdrawalId || !status) {
            return new NextResponse("Missing data", { status: 400 });
        }

        const result = await db.$transaction(async (tx) => {
            const currentWd = await tx.withdrawal.findUnique({
                where: { id: withdrawalId }
            });

            if (!currentWd) {
                throw new Error("NOT_FOUND");
            }

            if (currentWd.status !== "pending") {
                throw new Error("ALREADY_PROCESSED");
            }

            const updated = await tx.withdrawal.update({
                where: { id: withdrawalId },
                data: { status },
                include: { user: true }
            });

            // If rejected, refund the balance to the user
            if (status === "rejected") {
                await tx.user.update({
                    where: { id: currentWd.userId },
                    data: {
                        affiliateBalance: {
                            increment: currentWd.amount
                        }
                    }
                });
            }

            return updated;
        });

        // Trigger email notification in background
        if (result && result.user && result.user.email) {
            const { sendWithdrawalStatusEmail } = await import("@/lib/services/email");
            const formattedAmount = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0
            }).format(Number(result.amount));

            const bankDetails = `${result.bankName} - ${result.accountNumber} (a/n ${result.accountName})`;

            sendWithdrawalStatusEmail({
                toEmail: result.user.email,
                userName: result.user.name || "Pengguna",
                amount: formattedAmount,
                status: result.status as any,
                bankDetails
            }).catch(err => {
                console.error("[WITHDRAWAL_EMAIL_ERROR] Failed to send email:", err);
            });
        }

        // Trigger WhatsApp notification in background
        if (result && result.user && result.user.phone) {
            const { sendWhatsAppNotification } = await import("@/lib/services/whatsapp");
            const formattedAmount = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0
            }).format(Number(result.amount));

            const bankDetails = `${result.bankName} - ${result.accountNumber} (a.n ${result.accountName})`;
            const isApproved = result.status === "approved";

            const message = isApproved
                ? `Halo *${result.user.name || "Pengguna"}*,\n\nPermintaan penarikan saldo Anda senilai *${formattedAmount}* telah *DISETUJUI & DITRANSFER* ke rekening:\n*${bankDetails}*.\n\nSilakan periksa mutasi rekening Anda secara berkala. Terima kasih! 🙏`
                : `Halo *${result.user.name || "Pengguna"}*,\n\nPermintaan penarikan saldo Anda senilai *${formattedAmount}* ke rekening:\n*${bankDetails}*\ntelah *DITOLAK*. Saldo Anda telah dikembalikan secara otomatis ke akun Anda.\n\nJika ada pertanyaan, silakan hubungi tim support kami.`;

            sendWhatsAppNotification(result.user.phone, message).catch(err => {
                console.error("[WITHDRAWAL_WHATSAPP_ERROR] Failed to send WA notification:", err);
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[ADMIN_WITHDRAWAL_UPDATE]", error);
        if (error.message === "NOT_FOUND") return new NextResponse("Not found", { status: 404 });
        if (error.message === "ALREADY_PROCESSED") return new NextResponse("Already processed", { status: 400 });
        return new NextResponse("Internal Error", { status: 500 });
    }
}
