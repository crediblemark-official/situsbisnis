import { revalidatePath } from "next/cache";
import { db } from "@/lib/core/db";
import { Prisma } from "@prisma/client";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
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

    // Prisma upsert using compound unique key
    await db.credBuildPage.upsert({
      where: { 
        siteId_path: { siteId, path } 
      },
      update: {
        data: data as Prisma.JsonValue,
        useBuilder: true,
        updatedAt: new Date(),
      },
      create: {
        siteId,
        path,
        data: data as Prisma.JsonValue,
        updatedAt: new Date(),
      }
    });

    // Purge Next.js cache
    revalidatePath(path);

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

    const page = await db.credBuildPage.findUnique({
      where: { 
        siteId_path: { siteId, path } 
      }
    });

    return apiResponse(page?.data || {});
  } catch (error) {
    console.error("Error fetching CredBuild page:", error);
    return apiResponse({});
  }
}
