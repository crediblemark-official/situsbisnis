import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { InfrastructureClient } from "../index";

export async function exportBackupApi() {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const backupData = await InfrastructureClient.exportBackupData();
        const dateStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const filename = `backup-situsbisnis-${dateStr}_${timeStr}.json`;

        return new Response(JSON.stringify(backupData, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store, max-age=0"
            }
        });
    } catch (error) {
        console.error("Export Backup Error:", error);
        return apiError("Gagal mengekspor data backup database: " + (error as Error).message);
    }
}

export async function importBackupApi(req: Request) {
    try {
        const { session, error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const currentAdminId = (session?.user as any)?.id;
        if (!currentAdminId) {
            return apiError("Administrator ID tidak ditemukan di sesi aktif.", 400);
        }

        const body = await req.json();
        const result = await InfrastructureClient.importBackupData(body, currentAdminId);

        if (!result.success) {
            return apiError(result.message, 500);
        }

        return apiResponse({
            success: true,
            message: "Database platform berhasil dipulihkan dari data backup."
        });
    } catch (error) {
        console.error("Import Backup Error:", error);
        return apiError("Gagal memulihkan database dari backup: " + (error as Error).message);
    }
}
