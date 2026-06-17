import { NextRequest, NextResponse } from "next/server";
import { checkAndUpdateExpiredSubscriptions } from "@/modules/subscription/services/expiration.service";

/**
 * GET /api/cron/check-subscriptions
 *
 * Cron job untuk memeriksa dan memperbarui status subscription yang sudah expired.
 * Panggil endpoint ini secara periodik (misal setiap jam) via Vercel Cron, cron-job.org, dll.
 *
 * Proteksi: Header Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
        console.warn("[CRON] CRON_SECRET not configured — skipping auth check");
    } else if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await checkAndUpdateExpiredSubscriptions();
        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        console.error("[CRON] check-subscriptions failed:", error);
        return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
    }
}
