import { ContentClient } from "@/modules/content";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { z } from "zod";

const menuItemSchema = z.object({
    label: z.string().min(1, "Label is required"),
    url: z.string().min(1, "URL is required"),
    order: z.number().int().default(0),
    target: z.string().optional().default("_self"),
});

const menuUpdateSchema = z.object({
    items: z.array(menuItemSchema),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error || !siteId) return apiError(error || "Unauthorized", status);

        const { id: slug } = await params;
        if (!slug) return apiError("Slug required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, menuUpdateSchema);
        if (vError) return apiError(vError, vStatus, details);

        const { items } = data;

        const updated = await ContentClient.updateMenu(slug, items, siteId);
        return apiResponse(updated);
    } catch (error) {
        console.error("Error updating menu:", error);
        return apiError("Failed to update menu");
    }
}
