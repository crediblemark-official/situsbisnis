import { db } from "@/lib/core/db";
import { hooks } from "@/lib/core/hooks";
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";

export async function GET() {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const pages = await db.credBuildPage.findMany({
            where: { siteId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                path: true,
                title: true,
                description: true,
                isPublished: true,
                useBuilder: true,
                updatedAt: true
            }
        });
        return apiResponse(pages);
    } catch (error) {
        console.error("Error fetching pages:", error);
        return apiError("Failed to fetch pages");
    }
}

export async function POST(req: Request) {
    const { siteId, error, status } = await getApiContext(["admin", "owner", "editor"]);
    if (error) return apiError(error, status);

    try {
        const body = await req.json();
        const { id, path, title, description, imageUrl, body: contentBody, isPublished, useBuilder, metaData } = body;

        if (!path) return apiError("Missing path", 400);

        // Upsert logic
        if (id) {
            const existing = await db.credBuildPage.findUnique({ 
                where: { id }
            });
            
            if (existing && existing.siteId !== siteId) {
                return apiError("Unauthorized", 403);
            }

            let finalData = body.data;
            
            if (existing && !existing.useBuilder && useBuilder && (!finalData || Object.keys(finalData).length === 0)) {
                finalData = {
                    content: [
                        {
                            type: "RichText",
                            props: {
                                id: "migrated-content",
                                content: contentBody || ""
                            }
                        }
                    ],
                    root: { props: { title } }
                };
            }

            await db.credBuildPage.update({
                where: { id: id },
                data: {
                    path,
                    title,
                    description,
                    imageUrl,
                    body: contentBody,
                    isPublished,
                    useBuilder,
                    data: finalData ?? existing?.data ?? {},
                    updatedAt: new Date()
                }
            });
        } else {
            const existing = await db.credBuildPage.findUnique({
                where: { 
                    siteId_path: { siteId, path } 
                }
            });
            if (existing) {
                return apiError("Path already exists for this site", 409);
            }

            await db.credBuildPage.create({
                data: {
                    siteId,
                    path,
                    title,
                    description,
                    imageUrl,
                    body: contentBody,
                    isPublished: isPublished ?? true,
                    useBuilder: useBuilder ?? true,
                    data: {},
                }
            });
        }

        const targetPage = id ? await db.credBuildPage.findUnique({ where: { id } }) : await db.credBuildPage.findUnique({ where: { siteId_path: { siteId, path } } });
        const targetId = targetPage?.id;

        if (targetId && metaData && Array.isArray(metaData)) {
            await db.metaData.deleteMany({
                where: { pageId: targetId }
            });

            if (metaData.length > 0) {
                await db.metaData.createMany({
                    data: metaData.map((m: any) => ({
                        key: m.key,
                        value: m.value,
                        type: m.type || "text",
                        pageId: targetId,
                    }))
                });
            }
        }

        if (targetPage) {
            hooks.doAction("page_saved", targetPage);
            try {
                const { revalidateTag, revalidatePath } = await import("next/cache");
                revalidateTag(`site-${siteId}`, "default");
                revalidatePath(path);
                if (path === "/") {
                    revalidatePath("/");
                }
            } catch (cacheError) {
                console.error("Cache revalidation error:", cacheError);
            }
        }

        return apiResponse({ success: true });
    } catch (error) {
        console.error("Error saving page:", error);
        return apiError("Failed to save");
    }
}
