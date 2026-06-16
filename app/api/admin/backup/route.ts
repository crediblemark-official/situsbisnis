import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { exportBackupData, importBackupData } from "@/lib/services/backup.service";

/**
 * GET /api/admin/backup
 * Exports all database tables as a downloadable JSON file
 */
export async function GET() {
    try {
        const { error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const backupData = await exportBackupData();
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
        console.error("GET Admin Backup Route Error:", error);
        return apiError("Gagal mengekspor data backup database: " + (error as Error).message);
    }
}

/**
 * POST /api/admin/backup
 * Restores database from an uploaded JSON backup file
 */
export async function POST(req: Request) {
    try {
        const { session, error, status } = await getApiContext(["admin"], { requireSite: false });
        if (error) return apiError(error, status);

        const currentAdminId = (session?.user as any)?.id;
        if (!currentAdminId) {
            return apiError("Administrator ID tidak ditemukan di sesi aktif.", 400);
        }

        const body = await req.json();
        
        // Execute the restore
        const result = await importBackupData(body, currentAdminId);
        
        if (!result.success) {
            return apiError(result.message, 500);
        }

        return apiResponse({ 
            success: true, 
            message: "Database platform berhasil dipulihkan dari data backup." 
        });
    } catch (error) {
        console.error("POST Admin Backup Route Error:", error);
        return apiError("Gagal memulihkan database dari backup: " + (error as Error).message);
    }
}
