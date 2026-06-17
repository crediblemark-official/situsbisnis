import { NextResponse } from "next/server";
import { generatePageWithAI, generateSectionWithAI, refineFieldWithAI } from "@crediblemark/build-ai/server";

/**
 * Handler GET untuk mengambil data menu berdasarkan slug.
 */
export async function getMenusApi(req: Request) {
    try {
        const { siteId, error, status } = await getApiContext();
        if (error) return apiError(error, status);

        const { searchParams } = new URL(req.url);
        const slug = searchParams.get("slug") || "main";

        const menu = await PageClient.getMenu(slug, siteId);
        return apiResponse(menu);
    } catch (error) {
        console.error("GetMenus Error:", error);
        return apiError("Internal Error");
    }
}
import presetSchemas from "./schemas.json";
import { resolveAIConfig } from "../services/ai-config.service";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { PageClient } from "../index";
import { z } from "zod";

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
 * Handler POST untuk menghasilkan halaman/section/refine dengan AI.
 */
export async function generatePageWithAIApi(req: Request) {
  const aiConfig = await resolveAIConfig();

  if (!aiConfig) {
    return NextResponse.json(
      {
        error: "No AI API key is configured. Please add one of the following to your .env: GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, or NVIDIA_API_KEY.",
      },
      { status: 500 }
    );
  }

  try {
    const { prompt, mode, currentData, schemas } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const componentSchemas = schemas || presetSchemas;

    if (mode === "page") {
      const result = await generatePageWithAI(prompt, componentSchemas, aiConfig, currentData);
      return NextResponse.json(result);
    } else if (mode === "section") {
      const result = await generateSectionWithAI(prompt, componentSchemas, aiConfig, currentData);
      return NextResponse.json(result);
    } else if (mode === "refine") {
      const result = await refineFieldWithAI(prompt, currentData, aiConfig);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Invalid mode specified" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("API AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI request" }, { status: 500 });
  }
}

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
