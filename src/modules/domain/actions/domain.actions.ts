"use server";

import { getApiContext } from "@/lib/api/utils";
import { DomainClient } from "@/modules/domain";

export async function registerDomainAction(siteId: string, domain: string) {
    try {
        const { error, session } = await getApiContext(undefined, { requireSite: true });
        if (error || !session) return { success: false, error: error || "Unauthorized" };
        const result = await DomainClient.registerDomain(siteId, domain);
        return { success: result.status !== "error", message: result.message, details: result.details };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to register domain" };
    }
}

export async function verifyDomainAction(siteId: string, domain: string) {
    try {
        const { error, session } = await getApiContext(undefined, { requireSite: true });
        if (error || !session) return { success: false, error: error || "Unauthorized" };
        const result = await DomainClient.verifyDomain(siteId, domain);
        return { success: result.status === "valid", message: result.message, details: result.details };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to verify domain" };
    }
}

export async function removeDomainAction(siteId: string, domain: string) {
    try {
        const { error, session } = await getApiContext(undefined, { requireSite: true });
        if (error || !session) return { success: false, error: error || "Unauthorized" };
        const result = await DomainClient.removeDomain(siteId, domain);
        return { success: result.status === "success", message: result.message };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to remove domain" };
    }
}
