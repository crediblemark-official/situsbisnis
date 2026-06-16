import * as domainService from "../services/domain.service";

/**
 * Server Actions / Wrapper internal untuk pendaftaran custom domain.
 */
export async function registerDomainInternal(siteId: string, domain: string) {
    return domainService.registerDomain(siteId, domain);
}

/**
 * Server Actions / Wrapper internal untuk verifikasi custom domain.
 */
export async function verifyDomainInternal(siteId: string, domain: string) {
    return domainService.verifyDomain(siteId, domain);
}

/**
 * Server Actions / Wrapper internal untuk menghapus custom domain.
 */
export async function removeDomainInternal(siteId: string, domain: string) {
    return domainService.removeDomain(siteId, domain);
}
