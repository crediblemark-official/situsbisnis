import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PostClient } from "../index";
import { z } from "zod";

export const postSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Invalid slug format"),
    content: z.any().optional().default({}),
    status: z.string().optional().default("draft"),
    imageUrl: z.string().optional(),
    postId: z.string().optional(),
    excerpt: z.string().optional().nullable(),
    metaData: z.array(z.any()).optional(),
});

export async function postGetApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const result = await PostClient.listPosts(siteId, searchParams);
        return apiResponse(result);
    } catch (error) {
        console.error("Get Posts Error:", error);
        return apiError("Failed to fetch posts");
    }
}

export async function postPostApi(req: Request) {
    try {
        const { session, siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menambah data.`, 403);
        }

        const { data, error: vError, details, status: vStatus } = await validateBody(req, postSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await PostClient.createPost(siteId, data, session);
        return apiResponse(result);
    } catch (error) {
        console.error("Create Post Error:", error);
        return apiError("Failed to create post");
    }
}

export async function postGetDetailApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(undefined, { isPublic: true });
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const post = await PostClient.getPostDetail(id, siteId);
        return apiResponse(post);
    } catch (error) {
        console.error("Get Post Detail Error:", error);
        return apiError("Failed to fetch post");
    }
}

export async function postPatchApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const body = await req.json() as { isArchived?: boolean };
        const { isArchived } = body;

        const updated = await PostClient.archivePost(id, siteId, isArchived);
        return apiResponse({ success: true, item: updated });
    } catch (error) {
        console.error("Archive Post Error:", error);
        return apiError("Failed to archive post");
    }
}

export async function postPutApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { session, siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk mengubah data.`, 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const { data, error: vError, details, status: vStatus } = await validateBody(req, postSchema);
        if (vError) return apiError(vError, vStatus, details);

        const result = await PostClient.updatePost(id, siteId, data, session);
        return apiResponse(result);
    } catch (error) {
        console.error("Update Post Error:", error);
        return apiError("Failed to update post");
    }
}

export async function postDeleteApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, siteStatus, error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        if (siteStatus !== "active") {
            return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menghapus data.`, 403);
        }

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        const result = await PostClient.deletePost(id, siteId);
        return apiResponse(result);
    } catch (error) {
        console.error("Delete Post Error:", error);
        if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2003') {
            return apiError("Cannot delete because it is part of an existing record.", 400);
        }
        return apiError("Failed to delete post");
    }
}
