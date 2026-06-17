import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PageClient } from "@/modules/page";
import { z } from "zod";

const credBuildSchema = z.object({
  path: z.string().min(1),
  data: z.any(),
});

export async function POST(request: Request) {
  try {
    const { siteId, error: authError, status: authStatus } = await getApiContext(["admin", "editor", "owner"]);
    if (authError) return apiError(authError, authStatus);

    const { data: body, error: vError, details, status: vStatus } = await validateBody(request, credBuildSchema);
    if (vError) return apiError(vError, vStatus, details);

    const { path, data } = body;

    // Simpan data halaman via PageClient
    await PageClient.saveCredBuildPage(siteId, path, data);

    return apiResponse({ status: "ok" });
  } catch (error) {
    console.error("Error saving CredBuild page:", error);
    return apiError("Failed to save page");
  }
}

export async function GET(request: Request) {
  try {
    const { siteId, error: authError, status: authStatus } = await getApiContext();
    if (authError) return apiError(authError, authStatus);

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "/";

    // Ambil data halaman via PageClient
    const pageData = await PageClient.getCredBuildPage(siteId, path);

    return apiResponse(pageData);
  } catch (error) {
    console.error("Error fetching CredBuild page:", error);
    return apiResponse({});
  }
}
