"use server";

import { getApiContext } from "@/lib/api/utils";
import { InfrastructureClient } from "@/modules/infrastructure";
import { SiteClient } from "@/modules/site";

export async function exportBackupDataAction() {
    try {
        const { error, session } = await getApiContext(["admin"], { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const backupData = await InfrastructureClient.exportBackupData();
        return { success: true, result: backupData };
    } catch (err: any) {
        console.error("[EXPORT_BACKUP_DATA_ACTION] Error:", err);
        return { success: false, error: err.message || "Failed to export backup data" };
    }
}

export async function importBackupDataAction(backupData: any) {
    try {
        const { session, error } = await getApiContext(["admin"], { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        const currentAdminId = (session.user as any)?.id;
        if (!currentAdminId) {
            return { success: false, error: "Administrator ID tidak ditemukan di sesi aktif." };
        }

        const result = await InfrastructureClient.importBackupData(backupData, currentAdminId);
        if (!result.success) {
            return { success: false, error: result.message };
        }

        return { success: true, message: "Database platform berhasil dipulihkan dari data backup." };
    } catch (err: any) {
        console.error("[IMPORT_BACKUP_DATA_ACTION] Error:", err);
        return { success: false, error: err.message || "Failed to import backup data" };
    }
}

export async function deleteSiteAction(id: string) {
    try {
        const { error, session } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        if (!id) return { success: false, error: "Site ID required", status: 400 };

        await SiteClient.deleteSite(id);
        return { success: true, message: "Site deleted successfully" };
    } catch (serviceError: any) {
        console.error("[DELETE_SITE_ACTION] Error:", serviceError);
        const msg = serviceError?.message || "";
        if (msg === "SITE_NOT_FOUND") return { success: false, error: "Site not found", status: 404 };
        if (msg === "CANNOT_DELETE_ADMIN") return { success: false, error: "Cannot delete the platform admin site", status: 400 };
        return { success: false, error: "Failed to delete site" };
    }
}

export async function manageSiteAction(id: string, action: string) {
    try {
        const { error, session } = await getApiContext(["admin"]);
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        if (!id || !action) return { success: false, error: "Missing data", status: 400 };

        const result = await InfrastructureClient.manageSite(id, action as any);
        return { success: true, result };
    } catch (serviceError: any) {
        console.error("[MANAGE_SITE_ACTION] Error:", serviceError);
        const msg = serviceError?.message || "";
        if (msg === "SITE_NOT_FOUND") return { success: false, error: "Site not found", status: 404 };
        if (msg === "FREE_PLAN_NOT_FOUND") return { success: false, error: "Free plan not found in database", status: 404 };
        if (msg === "NO_SUBSCRIPTION") return { success: false, error: "No subscription found", status: 404 };
        if (msg === "TRIAL_ALREADY_EXTENDED") return { success: false, error: "Trial already extended", status: 400 };
        if (msg === "NOT_A_TRIAL") return { success: false, error: "This is not a trial subscription", status: 400 };
        if (msg === "INVALID_ACTION") return { success: false, error: "Invalid action", status: 400 };
        return { success: false, error: "Failed to update site" };
    }
}

export async function assignSiteOwnerAction(siteId: string, email: string) {
    try {
        const { error, session } = await getApiContext(["admin"], { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        if (!siteId || !email) {
            return { success: false, error: "Data tidak lengkap", status: 400 };
        }

        const result = await InfrastructureClient.assignSiteOwner(siteId, email.trim().toLowerCase());
        return result;
    } catch (serviceError: any) {
        console.error("[ASSIGN_SITE_OWNER_ACTION] Error:", serviceError);
        const msg = serviceError?.message || "";
        if (msg === "SITE_NOT_FOUND") {
            return { success: false, error: "Situs tidak ditemukan", status: 404 };
        }
        if (msg === "USER_NOT_FOUND") {
            return { success: false, error: "User dengan email tersebut tidak ditemukan", status: 404 };
        }
        return { success: false, error: "Gagal menghubungkan pemilik" };
    }
}

export async function checkUserEmailExistsAction(email: string) {
    try {
        const { error, session } = await getApiContext(["admin"], { requireSite: false });
        if (error || !session) return { success: false, exists: false, error: error || "Unauthorized" };

        if (!email) return { success: false, exists: false, error: "Email required" };

        const { findUserByEmailLimited } = await import("@/modules/auth");
        const user = await findUserByEmailLimited(email.trim().toLowerCase());
        
        return { 
            success: true, 
            exists: !!user, 
            userName: user?.name || null 
        };
    } catch (err: any) {
        console.error("[CHECK_USER_EMAIL_EXISTS_ACTION] Error:", err);
        return { success: false, exists: false, error: err.message || "Failed to check email" };
    }
}

export async function updateSiteSubdomainAction(siteId: string, subdomain: string) {
    try {
        const { error, session } = await getApiContext(["admin"], { requireSite: false });
        if (error || !session) return { success: false, error: error || "Unauthorized" };

        if (!siteId || !subdomain) {
            return { success: false, error: "Data tidak lengkap", status: 400 };
        }

        const normalizedSubdomain = subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
        if (normalizedSubdomain.length === 0) {
            return { success: false, error: "Format subdomain tidak valid", status: 400 };
        }

        await InfrastructureClient.updateSiteSubdomain(siteId, normalizedSubdomain);
        return { success: true, message: "Subdomain berhasil diubah" };
    } catch (serviceError: any) {
        console.error("[UPDATE_SITE_SUBDOMAIN_ACTION] Error:", serviceError);
        const msg = serviceError?.message || "";
        if (msg === "SITE_NOT_FOUND") {
            return { success: false, error: "Situs tidak ditemukan", status: 404 };
        }
        if (msg === "SUBDOMAIN_TAKEN") {
            return { success: false, error: "Subdomain sudah digunakan oleh situs lain", status: 400 };
        }
        return { success: false, error: serviceError.message || "Gagal mengubah subdomain" };
    }
}



