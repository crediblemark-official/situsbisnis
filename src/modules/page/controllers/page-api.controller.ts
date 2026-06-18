import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PageClient } from "../index";
import { z } from "zod";

/**
 * Handler GET untuk mengambil data menu berdasarkan slug.
 */
export async function getMenusApi(req: Request) {
    try {
        const { siteId } = await getApiContext(undefined, { requireSite: false });

        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug") || "main";

        const menu = await PageClient.getMenu(slug, siteId);
        return apiResponse(menu);
    } catch (error) {
        console.error("GetMenus Error:", error);
        return apiError("Internal Error");
    }
}

/**
 * Handler GET untuk mengambil detail data halaman berdasarkan ID.
 */
export async function getPageDetailApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { siteId, error, status } = await getApiContext();
    if (error) return apiError(error, status);

    const { id } = await params;
    if (!id) return apiError("Missing ID", 400);

    const page = await PageClient.getPageDetail(id, siteId);
    return apiResponse(page);
  } catch (err: any) {
    console.error("GetPageDetail Error:", err);
    if (err.message === "Page not found") {
      return apiError("Page not found", 404);
    }
    return apiError("Internal Error");
  }
}


const credBuildSchema = z.object({
  path: z.string().min(1),
  data: z.any(),
});

/**
 * Handler POST untuk menyimpan data halaman CredBuild.
 */
export async function postCredBuildPageApi(request: Request) {
  try {
    const { siteId, error: authError, status: authStatus } = await getApiContext(["admin", "editor", "owner"]);
    if (authError) return apiError(authError, authStatus);

    const { data: body, error: vError, details, status: vStatus } = await validateBody(request, credBuildSchema);
    if (vError) return apiError(vError, vStatus, details);

    const { path, data } = body;

    await PageClient.saveCredBuildPage(siteId, path, data);

    return apiResponse({ status: "ok" });
  } catch (error) {
    console.error("Error saving CredBuild page:", error);
    return apiError("Failed to save page");
  }
}

/**
 * Handler GET untuk mengambil data halaman CredBuild.
 */
export async function getCredBuildPageApi(request: Request) {
  try {
    const { siteId, error: authError, status: authStatus } = await getApiContext();
    if (authError) return apiError(authError, authStatus);

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "/";

    const pageData = await PageClient.getCredBuildPage(siteId, path);

    return apiResponse(pageData);
  } catch (error) {
    console.error("Error fetching CredBuild page:", error);
        return apiResponse({});
    }
}

/**
 * Handler GET untuk mengambil daftar halaman.
 */
export async function getPagesApi() {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
        if (error) return apiError(error, status);

        const pages = await PageClient.getPages(siteId);
        return apiResponse(pages);
    } catch (error) {
        console.error("Error fetching pages:", error);
        return apiError("Failed to fetch pages");
    }
}

/**
 * Handler POST untuk menyimpan halaman baru / upsert.
 */
export async function savePageApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
        if (error) return apiError(error, status);

        const body = await req.json();
        const { id, path, title, description, body: contentBody, isPublished, useBuilder, metaData, data } = body;

        if (!path) return apiError("Missing path", 400);

        const result = await PageClient.savePage(siteId, {
            id,
            path,
            title,
            description,
            body: contentBody,
            isPublished,
            useBuilder,
            metaData,
            data
        });

        return apiResponse({ success: true, page: result });
    } catch (error: any) {
        console.error("Error saving page:", error);
        if (error.message?.includes("already exists")) {
            return apiError("Path already exists for this site", 409);
        }
        return apiError("Failed to save");
    }
}

/**
 * Handler DELETE untuk menghapus halaman.
 */
export async function deletePageApi(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
        if (error) return apiError(error, status);

        const { id } = await params;
        if (!id) return apiError("ID required", 400);

        await PageClient.deletePage(id, siteId);
        return apiResponse({ success: true });
    } catch (error: any) {
        console.error("Error deleting page:", error);
        if (error.message === "Page not found" || error.message?.includes("not found")) {
            return apiError("Page not found or unauthorized", 404);
        }
        return apiError("Failed to delete");
    }
}

/**
 * Handler PUT untuk memperbarui menu.
 */
export async function updateMenuApi(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, status } = await getApiContext(["admin", "editor", "owner"]);
        if (error) return apiError(error, status);

        const { id: slug } = await params;
        if (!slug) return apiError("Slug required", 400);

        const body = await req.json();
        const { items } = body;

        if (!items || !Array.isArray(items)) return apiError("Items array required", 400);

        const updated = await PageClient.updateMenu(slug, items, undefined);
        return apiResponse(updated);
    } catch (error) {
        console.error("Error updating menu:", error);
        return apiError("Failed to update menu");
    }
}
