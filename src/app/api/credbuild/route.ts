import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { ContentClient } from "@/modules/content";
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

    // Simpan data halaman via ContentClient
    await ContentClient.saveCredBuildPage(siteId, path, data);

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

    // Ambil data halaman via ContentClient
    const pageData = await ContentClient.getCredBuildPage(siteId, path);

    return apiResponse(pageData);
  } catch (error) {
    console.error("Error fetching CredBuild page:", error);
    return apiResponse({});
  }
}
