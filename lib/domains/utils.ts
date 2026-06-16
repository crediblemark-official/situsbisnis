


/**
 * Dynamically detects the root domain of the application.
 * Returns the domain including port if it's localhost.
 */
export function getRootDomain(host?: string | null) {
  // 1. Handle localhost variations first for local development
  if (host && host.includes("localhost")) {
    return "localhost:3000";
  }

  // 2. If explicitly set in env, use it (strip protocol only)
  if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
    return process.env.NEXT_PUBLIC_ROOT_DOMAIN.replace(/^https?:\/\//, '');
  }

  // 3. If no host provided, fallback to localhost:3000
  if (!host) return "localhost:3000";

  // 4. Handle production domains (detecting apex)
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  
  // If it's a subdomain/domain or a platform domain with 3+ parts
  if (parts.length >= 3) {
    const last = parts[parts.length - 1].toLowerCase();
    const secondLast = parts[parts.length - 2].toLowerCase();
    
    // Check if the domain ends with a multi-part TLD (e.g. .co.id, .web.id, .co.uk)
    const isMultiPartTld = (last.length <= 3 && secondLast.length <= 3);
    
    if (isMultiPartTld) {
      // For store.example.co.id, parts.slice(-3) returns example.co.id
      return parts.slice(-3).join(".");
    }
    
    // For app.example.com, parts.slice(-2) returns example.com
    return parts.slice(-2).join(".");
  }

  return hostname;
}

/**
 * Checks if the custom domain is an apex/root domain or a subdomain.
 * Correctly handles multi-part TLDs like co.id, com.co, etc.
 */
export function isApexDomain(domain: string): boolean {
  if (!domain) return false;
  const hostname = domain.split(":")[0].toLowerCase();
  const parts = hostname.split(".");
  if (parts.length <= 2) return true;
  
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  
  if (parts.length === 3) {
    const isMultiPartTld = (last.length <= 3 && secondLast.length <= 3);
    return isMultiPartTld;
  }
  
  return false;
}

/**
 * Returns the appropriate protocol for the current host.
 */
export function getProtocol(host?: string | null) {
  if (typeof window !== "undefined") {
    return window.location.protocol.replace(":", "");
  }
  
  // If on localhost, use http
  if (host?.includes("localhost") || process.env.NODE_ENV === "development") {
    return "http";
  }
  
  return "https";
}

/**
 * Constructs the base URL for the current environment/tenant.
 */
export function getBaseUrl(host?: string | null) {
  if (typeof window !== "undefined") return window.location.origin;
  
  if (host) {
    return `${getProtocol(host)}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

