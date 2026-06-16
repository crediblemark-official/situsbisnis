import dns from "dns/promises";

/**
 * Verifies if a custom domain is correctly configured to point to the SitusBisnis infrastructure.
 * Supports both CNAME and A record verification.
 */
export async function verifyDomainConfig(domain: string) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const expectedCname = `cname.${rootDomain}`;
    const expectedIp = process.env.NEXT_PUBLIC_SERVER_IP || "168.231.119.22";

    const results = {
        cname: false,
        aRecord: false,
        valid: false,
        error: null as string | null
    };

    try {
        // 1. Try explicit CNAME check (Standard for subdomains)
        try {
            const cnames = await dns.resolveCname(domain);
            if (cnames.some(c => c.toLowerCase().includes(expectedCname.toLowerCase()))) {
                results.cname = true;
                results.valid = true;
                return results;
            }
        } catch {
            // Not a CNAME or resolve failed
        }

        // 2. IP Comparison (For ALIAS/ANAME or A Records)
        // We resolve both the domain and the expected CNAME and check if they share IPs
        try {
            const [targetIps, domainIps] = await Promise.all([
                dns.resolve4(expectedCname).catch(() => []),
                dns.resolve4(domain).catch(() => [])
            ]);

            // If we have a hardcoded server IP, also check against that
            if (expectedIp && domainIps.includes(expectedIp)) {
                results.aRecord = true;
                results.valid = true;
                return results;
            }

            // Compare resolved IPs from CNAME target vs Domain
            const commonIps = domainIps.filter(ip => targetIps.includes(ip));
            if (commonIps.length > 0) {
                results.aRecord = true; // Treated as A-record match since IPs matched
                results.valid = true;
                return results;
            }
        } catch (ipError) {
            console.error("[DOMAIN_VERIFICATION] IP Resolution error:", ipError);
        }

        return results;

    } catch (error) {
        console.error(`[DOMAIN_VERIFICATION] Failed for ${domain}:`, error);
        return { ...results, error: "DNS resolution failed" };
    }
}
