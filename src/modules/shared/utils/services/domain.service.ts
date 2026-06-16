import { TenantClient } from "@/modules/tenant";

export interface DomainStatus {
    status: "valid" | "pending" | "error" | "success";
    message: string;
    details?: any;
}

/**
 * Proxy delegator ke TenantClient untuk meminimalkan direct database access
 * dan menyelaraskan dengan arsitektur Modular Monolith.
 */
export const DomainService = {
    async registerDomain(siteId: string, domain: string): Promise<DomainStatus> {
        return TenantClient.registerDomain(siteId, domain) as Promise<DomainStatus>;
    },

    async verifyDomain(siteId: string, domain: string): Promise<DomainStatus> {
        return TenantClient.verifyDomain(siteId, domain) as Promise<DomainStatus>;
    },

    async removeDomain(siteId: string, domain: string): Promise<DomainStatus> {
        return TenantClient.removeDomain(siteId, domain) as Promise<DomainStatus>;
    }
};
