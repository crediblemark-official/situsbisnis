import * as domainRepo from "../repositories/domain.repository";
import { verifyDomainConfig as verifyDns } from "@/modules/shared/utils/domains/verification";
import { DokployService } from "./dokploy.service";
import { eventBus } from "@/modules/shared/core/event-bus";

export interface DomainStatus {
    status: "valid" | "pending" | "error";
    message: string;
    details?: any;
}

/**
 * Service to manage custom domains for self-hosted VPS / Dokploy infrastructure.
 */
export async function registerDomain(siteId: string, domain: string): Promise<DomainStatus> {
    try {
        if (!domain || !domain.trim()) {
            return { status: "error", message: "Nama domain tidak boleh kosong." };
        }

        const domainLower = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

        // 1. Validasi Format Domain
        const domainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)\.([a-z0-9-]{1,63}\.)*[a-z0-9-]{2,24}$/i;
        if (!domainRegex.test(domainLower) || !domainLower.includes(".")) {
            return { 
                status: "error", 
                message: "Format domain tidak valid. Contoh format yang benar: domainanda.com atau subdomain.domainanda.com" 
            };
        }

        // 2. Cegah Penggunaan Domain Utama Platform (SitusBisnis.com)
        const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "situsbisnis.com")
            .toLowerCase()
            .trim()
            .replace(/^https?:\/\//, "");

        if (domainLower === rootDomain || domainLower.endsWith(`.${rootDomain}`)) {
            return {
                status: "error",
                message: "Anda tidak dapat menggunakan domain utama atau subdomain dari platform sebagai custom domain."
            };
        }

        // 3. Cek Apakah Domain Sudah Digunakan Oleh Situs Lain (Unique Constraint Check)
        const existingSite = await domainRepo.findSiteByCustomDomain(domainLower, siteId);
        if (existingSite) {
            return {
                status: "error",
                message: "Domain ini sudah digunakan oleh situs lain. Silakan periksa kembali konfigurasi Anda atau hubungi admin dukungan."
            };
        }

        // 4. Update Database
        const updatedSite = await domainRepo.updateSiteCustomDomain(siteId, domainLower, false);

        // Revalidate cache
        try {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${siteId}`, "default");
            revalidateTag(`site-id-${updatedSite.subdomain}`, "default");
            revalidateTag(`site-id-${domainLower}`, "default");
        } catch (cacheError) {
            console.error("[registerDomain] Cache revalidation failed:", cacheError);
        }

        return { 
            status: "pending", 
            message: "Domain berhasil didaftarkan. Silakan arahkan DNS Anda." 
        };

    } catch (error) {
        console.error("[domain.service.registerDomain] Error:", error);
        return { status: "error", message: "Gagal mendaftarkan domain karena kesalahan sistem internal." };
    }
}

/**
 * Verifikasi DNS domain kustom.
 */
export async function verifyDomain(siteId: string, domain: string): Promise<DomainStatus> {
    try {
        const domainLower = domain.toLowerCase().trim();

        // 1. Pastikan domain yang diverifikasi cocok dengan yang terdaftar
        const currentSite = await domainRepo.findSiteCustomDomainInfo(siteId);

        if (!currentSite || currentSite.customDomain !== domainLower) {
            return { 
                status: "error", 
                message: "Domain yang diverifikasi tidak cocok dengan konfigurasi aktif situs Anda." 
            };
        }

        // 2. Lakukan DNS check
        const dnsResult = await verifyDns(domainLower);
        const isVerified = dnsResult.valid;

        // 3. Update status verifikasi di DB
        const updatedSite = await domainRepo.updateSiteCustomDomainVerified(siteId, isVerified);

        if (isVerified) {
            // Daftarkan domain ke Dokploy
            await DokployService.addDomain(domainLower).catch(err => {
                console.error("[DOKPLOY_API_ERROR] Gagal mendaftarkan domain ke Dokploy:", err);
            });

            // Kirim email notifikasi secara asinkron
            (async () => {
                try {
                    const siteOwner = await eventBus.request<{ siteId: string }, { email: string | null; name: string | null } | null>(
                        "request.auth.getSiteOwner",
                        { siteId }
                    );
                    if (siteOwner && siteOwner.email) {
                        const { sendDomainVerifiedEmail } = await import("@/modules/tenant/services/email.service");
                        await sendDomainVerifiedEmail({
                            toEmail: siteOwner.email,
                            userName: siteOwner.name || "Pengguna",
                            siteName: updatedSite.name,
                            domain: domain
                        });
                    }
                } catch (err) {
                    console.error("[DOMAIN_EMAIL_ERROR] Failed to send domain verification email:", err);
                }
            })();

            return { 
                status: "valid", 
                message: "Domain berhasil diverifikasi dan aktif!" 
            };
        }

        return { 
            status: "pending", 
            message: "DNS belum terdeteksi. Pastikan konfigurasi Anda sudah benar.",
            details: {
                dns: dnsResult
            }
        };

    } catch (error) {
        console.error("[domain.service.verifyDomain] Error:", error);
        return { status: "error", message: "Proses verifikasi gagal." };
    }
}

/**
 * Menghapus custom domain dari situs.
 */
export async function removeDomain(siteId: string, domain: string) {
    try {
        const domainLower = domain.toLowerCase().trim();

        // Hapus domain dari Dokploy
        await DokployService.deleteDomain(domainLower).catch(err => {
            console.error("[DOKPLOY_API_ERROR] Gagal menghapus domain dari Dokploy:", err);
        });

        // Hapus domain dari Database
        const updatedSite = await domainRepo.updateSiteCustomDomain(siteId, null, false);

        // Revalidate cache
        try {
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${siteId}`, "default");
            revalidateTag(`site-id-${updatedSite.subdomain}`, "default");
            revalidateTag(`site-id-${domainLower}`, "default");
        } catch (cacheError) {
            console.error("[removeDomain] Cache revalidation failed:", cacheError);
        }

        return { status: "success", message: "Domain berhasil dihapus." };
    } catch (error) {
        console.error("[domain.service.removeDomain] Error:", error);
        return { status: "error", message: "Gagal menghapus domain." };
    }
}
