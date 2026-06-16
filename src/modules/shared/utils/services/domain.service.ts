import { db } from "@/lib/core/db";
import { verifyDomainConfig as verifyDns } from "@/lib/domains/verification";
import { DokployService } from "@/lib/services/dokploy.service";

export interface DomainStatus {
    status: "valid" | "pending" | "error";
    message: string;
    details?: any;
}

/**
 * Service to manage custom domains for self-hosted VPS / Dokploy infrastructure.
 */
export const DomainService = {
    /**
     * Registers a new custom domain for a site.
     */
    async registerDomain(siteId: string, domain: string): Promise<DomainStatus> {
        try {
            if (!domain || !domain.trim()) {
                return { status: "error", message: "Nama domain tidak boleh kosong." };
            }

            const domainLower = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

            // 1. Validasi Format Domain
            // Harus memiliki setidaknya satu karakter titik (.), tidak boleh mengandung spasi atau karakter ilegal, mendukung TLD panjang & Punycode
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
            const existingSite = await db.site.findFirst({
                where: {
                    customDomain: domainLower,
                    id: { not: siteId }
                }
            });

            if (existingSite) {
                return {
                    status: "error",
                    message: "Domain ini sudah digunakan oleh situs lain. Silakan periksa kembali konfigurasi Anda atau hubungi admin dukungan."
                };
            }

            // 4. Update Database
            const updatedSite = await db.site.update({
                where: { id: siteId },
                data: { 
                    customDomain: domainLower,
                    customDomainVerified: false 
                },
                select: { subdomain: true }
            });

            // Revalidate cache
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${siteId}`, "default");
            revalidateTag(`site-id-${updatedSite.subdomain}`, "default");
            revalidateTag(`site-id-${domainLower}`, "default");

            return { 
                status: "pending", 
                message: "Domain berhasil didaftarkan. Silakan arahkan DNS Anda." 
            };

        } catch (error) {
            console.error("[DomainService.registerDomain] Error:", error);
            return { status: "error", message: "Gagal mendaftarkan domain karena kesalahan sistem internal." };
        }
    },

    /**
     * Verifies domain DNS.
     * Updates database status if successful.
     */
    async verifyDomain(siteId: string, domain: string): Promise<DomainStatus> {
        try {
            const domainLower = domain.toLowerCase().trim();

            // 1.5. Pastikan domain yang diverifikasi masih terdaftar di site tersebut
            const currentSite = await db.site.findUnique({
                where: { id: siteId },
                select: { customDomain: true }
            });

            if (!currentSite || currentSite.customDomain !== domainLower) {
                return { 
                    status: "error", 
                    message: "Domain yang diverifikasi tidak cocok dengan konfigurasi aktif situs Anda." 
                };
            }

            // 1. Perform DNS Check (Our local logic)
            const dnsResult = await verifyDns(domainLower);
            const isVerified = dnsResult.valid;

            // 2. Sync with Database
            const updatedSite = await db.site.update({
                where: { id: siteId },
                data: { customDomainVerified: isVerified }
            });

            if (isVerified) {
                // Panggil Dokploy API untuk mendaftarkan domain secara otomatis
                await DokployService.addDomain(domainLower).catch(err => {
                    console.error("[DOKPLOY_API_ERROR] Gagal mendaftarkan domain ke Dokploy:", err);
                });

                // Send email notification in background
                const { IdentityClient } = await import("@/lib/modules/identity/client");
                const siteOwner = await IdentityClient.getSiteOwner(siteId);
                if (siteOwner && siteOwner.email) {
                    const { sendDomainVerifiedEmail } = await import("@/lib/services/email");
                    sendDomainVerifiedEmail({
                        toEmail: siteOwner.email,
                        userName: siteOwner.name || "Pengguna",
                        siteName: updatedSite.name,
                        domain: domain
                    }).catch(err => {
                        console.error("[DOMAIN_EMAIL_ERROR] Failed to send domain verification email:", err);
                    });
                }

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
            console.error("[DomainService.verifyDomain] Error:", error);
            return { status: "error", message: "Proses verifikasi gagal." };
        }
    },

    /**
     * Removes a domain from Database.
     */
    async removeDomain(siteId: string, _domain: string) {
        try {
            const domainLower = _domain.toLowerCase().trim();

            // Hapus domain dari Dokploy secara otomatis
            await DokployService.deleteDomain(domainLower).catch(err => {
                console.error("[DOKPLOY_API_ERROR] Gagal menghapus domain dari Dokploy:", err);
            });

            // Clear from Database
            const updatedSite = await db.site.update({
                where: { id: siteId },
                data: { 
                    customDomain: null,
                    customDomainVerified: false 
                },
                select: { subdomain: true }
            });

            // Revalidate cache
            const { revalidateTag } = await import("next/cache");
            revalidateTag(`site-${siteId}`, "default");
            revalidateTag(`site-id-${updatedSite.subdomain}`, "default");
            revalidateTag(`site-id-${domainLower}`, "default");

            return { status: "success", message: "Domain berhasil dihapus." };
        } catch (error) {
            console.error("[DomainService.removeDomain] Error:", error);
            return { status: "error", message: "Gagal menghapus domain." };
        }
    }
};
