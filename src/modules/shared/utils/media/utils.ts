/**
 * Helper to get a proxied URL for media items to bypass CORS and upstream timeouts.
 * Supports optional resizing and quality parameters.
 */
export function getProxiedUrl(
    url: string | null | undefined, 
    options?: { w?: number; h?: number; q?: number }
): string {
    if (!url) return "";
    
    // If it's a local URL or blob, return as is (but we can still append params if needed)
    if (url.startsWith("/") || url.startsWith("blob:") || url.startsWith("data:")) {
        if (!options || Object.keys(options).length === 0) return url;
        
        const separator = url.includes("?") ? "&" : "?";
        const params = new URLSearchParams();
        if (options.w) params.append("w", options.w.toString());
        if (options.h) params.append("h", options.h.toString());
        if (options.q) params.append("q", options.q.toString());
        
        const queryString = params.toString();
        return queryString ? `${url}${separator}${queryString}` : url;
    }

    // Prepare base proxy URL
    let proxyUrl = url;
    if (!url.includes("/api/media/proxy")) {
        proxyUrl = `/api/media/proxy?url=${encodeURIComponent(url)}`;
    }

    // Append resizing/quality params if provided
    if (options && Object.keys(options).length > 0) {
        const params = new URLSearchParams();
        if (options.w) params.append("w", options.w.toString());
        if (options.h) params.append("h", options.h.toString());
        if (options.q) params.append("q", options.q.toString());
        
        const queryString = params.toString();
        const separator = proxyUrl.includes("?") ? "&" : "?";
        return queryString ? `${proxyUrl}${separator}${queryString}` : proxyUrl;
    }

    return proxyUrl;
}
