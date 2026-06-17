import { eventBus } from "@/modules/shared/core/event-bus";

interface CrudEventPayload {
    model: string;
    siteId: string;
    item: any;
}

async function handleCrudEvent(channel: string, payload: CrudEventPayload) {
    try {
        const { revalidateTag, revalidatePath } = await import("next/cache");
        revalidateTag(`site-${payload.siteId}`, "default");

        if (payload.model === "post" && payload.item?.slug) {
            revalidatePath("/blog");
            revalidatePath(`/blog/${payload.item.slug}`);
        }
    } catch (err) {
        console.error(`[crud:${channel}] Error invalidating cache:`, err);
    }
}

export function registerCrudCacheListener() {
    eventBus.subscribe("crud.created", ({ data }) => handleCrudEvent("crud.created", data));
    eventBus.subscribe("crud.updated", ({ data }) => handleCrudEvent("crud.updated", data));
    eventBus.subscribe("crud.deleted", ({ data }) => handleCrudEvent("crud.deleted", data));
}