import { eventBus } from "@/modules/shared/core/event-bus";
import { unstable_cache } from "next/cache";

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function buildPagination(searchParams: URLSearchParams): PaginationParams {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50")));
    return { page, limit, skip: (page - 1) * limit };
}

export async function fetchWithCache<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    tags: string[],
    revalidate = 300
): Promise<T> {
    const cached = unstable_cache(fetchFn, [cacheKey], { revalidate, tags });
    return cached();
}

export async function publishCrudEvent(event: string, model: string, siteId: string, item: any): Promise<void> {
    try {
        await eventBus.publish(event, { model, siteId, item }, "crud");
    } catch (err) {
        console.error(`Event publish error [${event}]:`, err);
    }
}

export async function checkResourceLimit(siteId: string, limitType: string): Promise<{ allowed: boolean; message: string }> {
    return eventBus.request<{ siteId: string; limitType: string }, { allowed: boolean; message: string }>(
        "request.billing.checkLimit",
        { siteId, limitType }
    );
}
