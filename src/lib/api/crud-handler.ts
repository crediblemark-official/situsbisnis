import { db } from "@/lib/core/db";
import { getApiContext, apiResponse, apiError, validateBody } from "@/lib/api/utils";
import { BillingClient } from "@/lib/modules/billing/client";
import { z } from "zod";
import { Prisma, Role } from "@prisma/client";
import { AppError } from "./errors";
import { createLogger } from "@/lib/core/logger";
import { unstable_cache } from "next/cache";

export interface CrudHandlerConfig<T extends z.ZodType<any, any> = z.ZodType<any, any>> {
    model: Uncapitalize<Prisma.ModelName>;
    schema?: T;
    roles?: Role[]; // e.g. ["admin", "editor", "owner"]
    limitCheckType?: string; // e.g. "maxProducts"
    idField?: string; // For updates, usually "id", but some schemas use "productId"
    includeArchivedLogic?: boolean;
    transformData?: (_data: z.infer<T>, _session: any) => any;
    isPublicGet?: boolean;
    listSelect?: any; // Fields to select for the collection view
}

export function createCrudHandler<T extends z.ZodType<any, any>>(config: CrudHandlerConfig<T>) {
    const modelDelegate = (db as any)[config.model];
    const modelLogger = createLogger(`crud:${config.model}`);

    return {
        collection: {
            GET: async (req: Request) => {
                try {
                    const { session, siteId, error, status } = await getApiContext(undefined, { isPublic: config.isPublicGet });
                    if (error) return apiError(error, status);

                    const { searchParams } = new URL(req.url);
                    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
                    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50")));
                    const skip = (page - 1) * limit;

                    const whereCondition: any = { siteId };

                    if (config.includeArchivedLogic) {
                        const isAdminOrEditor = (session?.user as any)?.role === "admin" || (session?.user as any)?.role === "editor";
                        const includeArchived = searchParams.get("includeArchived") === "true";
                        
                        if (!(isAdminOrEditor && includeArchived)) {
                            whereCondition.isArchived = false;
                        }
                    }

                    // Temporary logic for testimonials (status=all)
                    if (config.model === "testimonial") {
                        const statusParam = searchParams.get('status');
                        if (statusParam !== 'all') {
                            whereCondition.isApproved = true;
                        }
                    }

                    let total = 0;
                    let items = [];

                    // Caching hanya untuk request publik (non-autentikasi) untuk mencegah kebocoran data antar user
                    if (config.isPublicGet && siteId) {
                        const fetchCachedData = unstable_cache(
                            async (whereJson: string, lim: number, sk: number, selectJson: string) => {
                                const parsedWhere = JSON.parse(whereJson);
                                const parsedSelect = selectJson ? JSON.parse(selectJson) : undefined;

                                const totalCount = await modelDelegate.count({ where: parsedWhere });
                                const records = await modelDelegate.findMany({
                                    where: parsedWhere,
                                    orderBy: { createdAt: 'desc' },
                                    take: lim,
                                    skip: sk,
                                    ...(parsedSelect ? { select: parsedSelect } : {})
                                });
                                return { total: totalCount, items: records };
                            },
                            [`${config.model}-list-${siteId}-${page}-${limit}-${JSON.stringify(whereCondition)}`],
                            {
                                revalidate: 300, // Simpan cache selama 5 menit
                                tags: [`site-${siteId}`, `site-${siteId}-${config.model}`] // Terinvalidasi otomatis saat POST/PUT/DELETE
                            }
                        );

                        const cached = await fetchCachedData(
                            JSON.stringify(whereCondition),
                            limit,
                            skip,
                            config.listSelect ? JSON.stringify(config.listSelect) : ""
                        );
                        total = cached.total;
                        items = cached.items;
                    } else {
                        // Bypass cache jika request membutuhkan login (admin/editor dashboard)
                        total = await modelDelegate.count({ where: whereCondition });
                        items = await modelDelegate.findMany({
                            where: whereCondition,
                            orderBy: { createdAt: 'desc' },
                            take: limit,
                            skip: skip,
                            ...(config.listSelect ? { select: config.listSelect } : {})
                        });
                    }

                    const result = {
                        data: items,
                        pagination: {
                            total,
                            page,
                            limit,
                            totalPages: Math.ceil(total / limit)
                        }
                    };

                    // For backward compatibility with some components that expect { products: [...] } etc.
                    if (config.model === "product") (result as any).products = items;
                    if (config.model === "post") (result as any).posts = items;

                    return apiResponse(result);
                } catch (error: unknown) {
                    if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
                    modelLogger.error({ error }, `GET ${config.model} error`);
                    return apiError("Internal Error");
                }
            },
            
            POST: async (req: Request) => {
                try {
                    const roles: Role[] = config.roles || ["admin", "editor", "owner"];
                    const { session, siteId, siteStatus, error, status } = await getApiContext(roles);
                    if (error) return apiError(error, status);

                    // Block creation if site is not active
                    if (siteStatus !== "active") {
                        return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menambah data.`, 403);
                    }

                    if (!config.schema) return apiError("Schema required for POST", 500);

                    const { data, error: vError, details, status: vStatus } = await validateBody(req, config.schema);
                    if (vError) return apiError(vError, vStatus, details);

                    const idField = (config.idField || "id") as keyof typeof data;
                    // Remove the idField and metaData from data before saving
                    const { [idField]: _extractedId, metaData, ...updateDataRaw } = data;
                    
                    const finalData = config.transformData ? config.transformData(updateDataRaw, session) : updateDataRaw;

                    // Create new
                    if (config.limitCheckType) {
                        const limitCheck = await BillingClient.checkSiteLimit(siteId, config.limitCheckType as any);
                        if (!limitCheck.allowed) return apiError(limitCheck.message, 403);
                    }

                    // Define models that don't have updatedAt field in schema.prisma
                    const modelsWithoutUpdatedAt = ["galleryItem", "mediaItem", "mediaFolder", "contactSubmission", "orderItem", "menuItem"];
                    const shouldAddUpdatedAt = !modelsWithoutUpdatedAt.includes(config.model);

                    const created = await modelDelegate.create({
                        data: { 
                            ...finalData, 
                            siteId, 
                            ...(shouldAddUpdatedAt ? { updatedAt: new Date() } : {})
                        }
                    });

                    // Save metaData relation if present
                    if (created && metaData && Array.isArray(metaData)) {
                        const foreignKeyField = `${config.model}Id`;
                        await db.metaData.createMany({
                            data: metaData.map((m: any) => ({
                                key: m.key,
                                value: m.value,
                                type: m.type || "text",
                                [foreignKeyField]: created.id
                            }))
                        });
                    }
                    
                    // Invalidasi cache situs setelah data baru dibuat
                    try {
                        const { revalidateTag, revalidatePath } = await import("next/cache");
                        revalidateTag(`site-${siteId}`, "default");

                        // Untuk post: invalidasi juga path blog secara spesifik
                        if (config.model === "post" && created) {
                            revalidatePath("/blog");
                            if ((created as any).slug) {
                                revalidatePath(`/blog/${(created as any).slug}`);
                            }
                        }
                    } catch (cacheError) {
                        console.error("Cache revalidation error setelah POST:", cacheError);
                    }
                    
                    return apiResponse({ success: true, item: created, product: created, testimonial: created });
                } catch (error: unknown) {
                    if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
                    modelLogger.error({ error }, `POST ${config.model} error`);
                    return apiError("Internal Error");
                }
            }
        },
        detail: {
            GET: async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
                try {
                    const { siteId, error, status } = await getApiContext(undefined, { isPublic: config.isPublicGet });
                    if (error) return apiError(error, status);

                    const { id } = await params;
                    if (!id) return apiError("ID required", 400);

                    const hasMetaData = ["post", "product"].includes(config.model);
                    const existing = await modelDelegate.findFirst({
                        where: { id, siteId },
                        ...(hasMetaData ? { include: { metaData: true } } : {})
                    });
                    
                    if (!existing) return apiError("Item not found", 404);

                    return apiResponse(existing);
                } catch (error: unknown) {
                    if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
                    modelLogger.error({ error }, `GET DETAIL ${config.model} error`);
                    return apiError("Internal Error");
                }
            },

            PATCH: async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
                try {
                    const roles: Role[] = config.roles || ["admin", "editor", "owner"];
                    const { siteId, error, status } = await getApiContext(roles);
                    if (error) return apiError(error, status);

                    const { id } = await params;
                    if (!id) return apiError("ID required", 400);

                    const body = await req.json() as { isArchived?: boolean };
                    const { isArchived } = body;

                    const existing = await modelDelegate.findUnique({ where: { id } });
                    if (!existing || (existing as { siteId: string }).siteId !== siteId) {
                        return apiError("Not Found or Unauthorized", 404);
                    }

                    const updated = await modelDelegate.update({
                        where: { id },
                        data: { isArchived }
                    });

                    return apiResponse({ success: true, item: updated });
                } catch (error: unknown) {
                    if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
                    modelLogger.error({ error }, `PATCH ${config.model} error`);
                    return apiError("Internal Error");
                }
            },

            PUT: async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
                try {
                    const roles: Role[] = config.roles || ["admin", "editor", "owner"];
                    const { session, siteId, siteStatus, error, status } = await getApiContext(roles);
                    if (error) return apiError(error, status);

                    // Block updates if site is not active
                    if (siteStatus !== "active") {
                        return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk mengubah data.`, 403);
                    }

                    if (!config.schema) return apiError("Schema required for PUT", 500);

                    const { id } = await params;
                    if (!id) return apiError("ID required", 400);

                    const { data, error: vError, details, status: vStatus } = await validateBody(req, config.schema);
                    if (vError) return apiError(vError, vStatus, details);

                    const idField = (config.idField || "id") as keyof typeof data;
                    const { [idField]: _extractedId, metaData, ...updateDataRaw } = data;
                    const finalData = config.transformData ? config.transformData(updateDataRaw, session) : updateDataRaw;

                    const existing = await modelDelegate.findFirst({ where: { id, siteId } });
                    if (!existing) return apiError("Not Found or Unauthorized", 404);

                    const modelsWithoutUpdatedAt = ["galleryItem", "mediaItem", "mediaFolder", "contactSubmission", "orderItem", "menuItem"];
                    const shouldAddUpdatedAt = !modelsWithoutUpdatedAt.includes(config.model);

                    const updated = await modelDelegate.update({
                        where: { id },
                        data: { 
                            ...finalData, 
                            ...(shouldAddUpdatedAt ? { updatedAt: new Date() } : {})
                        }
                    });

                    // Save metaData relation if present
                    if (updated && metaData && Array.isArray(metaData)) {
                        const foreignKeyField = `${config.model}Id`;
                        await db.metaData.deleteMany({
                            where: { [foreignKeyField]: id }
                        });
                        if (metaData.length > 0) {
                            await db.metaData.createMany({
                                data: metaData.map((m: any) => ({
                                    key: m.key,
                                    value: m.value,
                                    type: m.type || "text",
                                    [foreignKeyField]: id
                                }))
                            });
                        }
                    }

                    // Invalidasi cache situs setelah data diubah
                    try {
                        const { revalidateTag, revalidatePath } = await import("next/cache");
                        revalidateTag(`site-${siteId}`, "default");

                        // Untuk post: invalidasi juga path blog secara spesifik
                        if (config.model === "post" && updated) {
                            revalidatePath("/blog");
                            if ((updated as any).slug) {
                                revalidatePath(`/blog/${(updated as any).slug}`);
                            }
                        }
                    } catch (cacheError) {
                        console.error("Cache revalidation error setelah PUT:", cacheError);
                    }

                    return apiResponse({ success: true, item: updated, product: updated, testimonial: updated });
                } catch (error: unknown) {
                    if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
                    modelLogger.error({ error }, `PUT ${config.model} error`);
                    return apiError("Internal Error");
                }
            },

            DELETE: async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
                try {
                    const roles: Role[] = config.roles || ["admin", "editor", "owner"];
                    const { siteId, siteStatus, error, status } = await getApiContext(roles);
                    if (error) return apiError(error, status);

                    // Block deletion if site is not active
                    if (siteStatus !== "active") {
                        return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menghapus data.`, 403);
                    }

                    const { id } = await params;
                    if (!id) return apiError("ID required", 400);

                    const existing = await modelDelegate.findFirst({
                        where: { id, siteId }
                    });
                    
                    if (!existing) return apiError("Item not found", 404);

                    await modelDelegate.delete({
                        where: { id }
                    });
                    
                    // Invalidasi cache situs setelah data dihapus
                    try {
                        const { revalidateTag, revalidatePath } = await import("next/cache");
                        revalidateTag(`site-${siteId}`, "default");

                        // Untuk post: invalidasi juga path blog secara spesifik
                        if (config.model === "post" && existing) {
                            revalidatePath("/blog");
                            if ((existing as any).slug) {
                                revalidatePath(`/blog/${(existing as any).slug}`);
                            }
                        }
                    } catch (cacheError) {
                        console.error("Cache revalidation error setelah DELETE:", cacheError);
                    }
                    
                    return apiResponse({ success: true });
                } catch (error: unknown) {
                    if (error instanceof AppError) return apiError(error.message, error.statusCode, error.details);
                    modelLogger.error({ error }, `DELETE ${config.model} error`);
                    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
                        return apiError("Cannot delete because it is part of an existing record.", 400);
                    }
                    return apiError("Internal Error");
                }
            }
        }
    };
}
