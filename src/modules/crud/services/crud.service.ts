import { db } from "@/modules/shared/core/db";
import { getApiContext, apiResponse, apiError, validateBody } from "@/modules/shared/utils/api/utils";
import { eventBus } from "@/modules/shared/core/event-bus";
import { z } from "zod";
import { Prisma, Role } from "@prisma/client";
import { AppError } from "@/modules/shared/utils/api/errors";
import { createLogger } from "@/modules/shared/core/logger";
import { unstable_cache } from "next/cache";
import type { CrudHandlerConfig, CrudHandler } from "../crud.types";

const logger = createLogger("crud:service");

export function createCrudHandler<T extends z.ZodType<any, any>>(config: CrudHandlerConfig<T>): CrudHandler {
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

                    if (config.model === "testimonial") {
                        const statusParam = searchParams.get('status');
                        if (statusParam !== 'all') {
                            whereCondition.isApproved = true;
                        }
                    }

                    let total = 0;
                    let items = [];

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
                            { revalidate: 300, tags: [`site-${siteId}`, `site-${siteId}-${config.model}`] }
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
                        total = await modelDelegate.count({ where: whereCondition });
                        items = await modelDelegate.findMany({
                            where: whereCondition,
                            orderBy: { createdAt: 'desc' },
                            take: limit,
                            skip: skip,
                            ...(config.listSelect ? { select: config.listSelect } : {})
                        });
                    }

                    const result: any = {
                        data: items,
                        pagination: {
                            total,
                            page,
                            limit,
                            totalPages: Math.ceil(total / limit)
                        }
                    };

                    if (config.model === "product") result.products = items;
                    if (config.model === "post") result.posts = items;

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

                    if (siteStatus !== "active") {
                        return apiError(`Situs Anda sedang ${siteStatus}. Silakan perbarui langganan untuk menambah data.`, 403);
                    }

                    if (!config.schema) return apiError("Schema required for POST", 500);

                    const { data, error: vError, details, status: vStatus } = await validateBody(req, config.schema);
                    if (vError) return apiError(vError, vStatus, details);

                    const idField = (config.idField || "id") as keyof typeof data;
                    const { [idField]: _extractedId, metaData, ...updateDataRaw } = data;

                    const finalData = config.transformData ? config.transformData(updateDataRaw, session) : updateDataRaw;

                    if (config.limitCheckType) {
                        const limitCheck = await eventBus.request<{ siteId: string; limitType: string }, { allowed: boolean; message: string }>(
                            "request.billing.checkLimit",
                            { siteId, limitType: config.limitCheckType }
                        );
                        if (!limitCheck.allowed) return apiError(limitCheck.message, 403);
                    }

                    const modelsWithoutUpdatedAt = ["galleryItem", "mediaItem", "mediaFolder", "contactSubmission", "orderItem", "menuItem"];
                    const shouldAddUpdatedAt = !modelsWithoutUpdatedAt.includes(config.model);

                    const created = await modelDelegate.create({
                        data: {
                            ...finalData,
                            siteId,
                            ...(shouldAddUpdatedAt ? { updatedAt: new Date() } : {})
                        }
                    });

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

                    try {
                        eventBus.publish("crud.created", {
                            model: config.model,
                            siteId,
                            item: created
                        }, "crud");
                    } catch (eventError) {
                        console.error("Event publish error after POST:", eventError);
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

                    try {
                        eventBus.publish("crud.updated", {
                            model: config.model,
                            siteId,
                            item: updated
                        }, "crud");
                    } catch (eventError) {
                        console.error("Event publish error after PUT:", eventError);
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

                    try {
                        eventBus.publish("crud.deleted", {
                            model: config.model,
                            siteId,
                            item: existing
                        }, "crud");
                    } catch (eventError) {
                        console.error("Event publish error after DELETE:", eventError);
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
