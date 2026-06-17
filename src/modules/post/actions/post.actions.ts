"use server";

import { getApiContext } from "@/lib/api/utils";
import { db } from "@/modules/shared/core/db";
import { eventBus } from "@/modules/shared/core/event-bus";
import { postSchema } from "../api/post";
import { testimonialSchema } from "../api/testimonial";
import { z } from "zod";

const termSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
});

export async function createPostAction(body: any) {
    try {
        const { session, siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = postSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        // Limit Check
        const limitCheck = await eventBus.request<{ siteId: string; limitType: string }, { allowed: boolean; message: string }>(
            "request.billing.checkLimit",
            { siteId, limitType: "maxPosts" }
        );
        if (!limitCheck.allowed) return { success: false, error: limitCheck.message };

        const { status, metaData, ...rest } = validation.data;
        const finalData = {
            ...rest,
            published: status === "published",
            authorId: session?.user?.id
        };

        const created = await db.post.create({
            data: {
                ...finalData,
                siteId,
                updatedAt: new Date()
            }
        });

        if (created && metaData && Array.isArray(metaData)) {
            await db.metaData.createMany({
                data: metaData.map((m: any) => ({
                    key: m.key,
                    value: m.value,
                    type: m.type || "text",
                    postId: created.id
                }))
            });
        }

        await eventBus.publish("crud.created", {
            model: "post",
            siteId,
            item: created
        }, "crud").catch(console.error);

        return { success: true, item: created };
    } catch (err: any) {
        console.error("[CREATE_POST_ACTION] Error:", err);
        return { success: false, error: "Failed to create post" };
    }
}

export async function updatePostAction(id: string, body: any) {
    try {
        const { session, siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        if (!id) return { success: false, error: "ID required" };

        const validation = postSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const existing = await db.post.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Post not found or unauthorized" };

        const { status, metaData, ...rest } = validation.data;
        const finalData = {
            ...rest,
            published: status === "published",
            authorId: session?.user?.id
        };

        const updated = await db.post.update({
            where: { id },
            data: {
                ...finalData,
                updatedAt: new Date()
            }
        });

        if (metaData && Array.isArray(metaData)) {
            await db.metaData.deleteMany({ where: { postId: id } });
            await db.metaData.createMany({
                data: metaData.map((m: any) => ({
                    key: m.key,
                    value: m.value,
                    type: m.type || "text",
                    postId: id
                }))
            });
        }

        await eventBus.publish("crud.updated", {
            model: "post",
            siteId,
            item: updated
        }, "crud").catch(console.error);

        return { success: true, item: updated };
    } catch (err: any) {
        console.error("[UPDATE_POST_ACTION] Error:", err);
        return { success: false, error: "Failed to update post" };
    }
}

export async function deletePostAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!id) return { success: false, error: "ID required" };

        const existing = await db.post.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Post not found or unauthorized" };

        await db.metaData.deleteMany({ where: { postId: id } });
        const deleted = await db.post.delete({ where: { id } });

        await eventBus.publish("crud.deleted", {
            model: "post",
            siteId,
            item: deleted
        }, "crud").catch(console.error);

        return { success: true, item: deleted };
    } catch (err: any) {
        console.error("[DELETE_POST_ACTION] Error:", err);
        return { success: false, error: "Failed to delete post" };
    }
}

import { PostClient } from "@/modules/post";

export async function createTermAction(taxonomyId: string, body: any) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const validation = termSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        try {
            const created = await PostClient.createTerm(taxonomyId, siteId, validation.data);

            await eventBus.publish("crud.created", {
                model: "term",
                siteId,
                item: created
            }, "crud").catch(console.error);

            return { success: true, item: created };
        } catch (err: any) {
            if (err.message === "Taxonomy not found") {
                return { success: false, error: "Taxonomy not found" };
            }
            throw err;
        }
    } catch (err: any) {
        console.error("[CREATE_TERM_ACTION] Error:", err);
        return { success: false, error: "Failed to create term" };
    }
}

export async function updateTermAction(termId: string, body: any) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const validation = termSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        try {
            const updated = await PostClient.updateTerm(termId, siteId, validation.data);

            await eventBus.publish("crud.updated", {
                model: "term",
                siteId,
                item: updated
            }, "crud").catch(console.error);

            return { success: true, item: updated };
        } catch (err: any) {
            if (err.message === "Term not found") {
                return { success: false, error: "Term not found or unauthorized" };
            }
            throw err;
        }
    } catch (err: any) {
        console.error("[UPDATE_TERM_ACTION] Error:", err);
        return { success: false, error: "Failed to update term" };
    }
}

export async function deleteTermAction(termId: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        try {
            const result = await PostClient.deleteTerm(termId, siteId);

            await eventBus.publish("crud.deleted", {
                model: "term",
                siteId,
                item: { id: termId }
            }, "crud").catch(console.error);

            return { success: true, result };
        } catch (err: any) {
            if (err.message === "Term not found") {
                return { success: false, error: "Term not found or unauthorized" };
            }
            throw err;
        }
    } catch (err: any) {
        console.error("[DELETE_TERM_ACTION] Error:", err);
        return { success: false, error: "Failed to delete term" };
    }
}

export async function createTestimonialAction(body: any) {
    try {
        const { session, siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = testimonialSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        // Limit Check
        const limitCheck = await eventBus.request<{ siteId: string; limitType: string }, { allowed: boolean; message: string }>(
            "request.billing.checkLimit",
            { siteId, limitType: "maxTestimonials" }
        );
        if (!limitCheck.allowed) return { success: false, error: limitCheck.message };

        const isAdmin = session?.user?.role === "admin" || session?.user?.role === "editor";
        const finalData = {
            ...validation.data,
            isApproved: validation.data.isApproved !== undefined ? validation.data.isApproved : isAdmin,
        };

        const created = await db.testimonial.create({
            data: {
                ...finalData,
                siteId
            }
        });

        await eventBus.publish("crud.created", {
            model: "testimonial",
            siteId,
            item: created
        }, "crud").catch(console.error);

        return { success: true, item: created };
    } catch (err: any) {
        console.error("[CREATE_TESTIMONIAL_ACTION] Error:", err);
        return { success: false, error: "Failed to create testimonial" };
    }
}

export async function updateTestimonialAction(id: string, body: any) {
    try {
        const { siteId, siteStatus, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (siteStatus !== "active") {
            return { success: false, error: "Situs Anda sedang tidak aktif. Silakan perbarui langganan." };
        }

        const validation = testimonialSchema.safeParse(body);
        if (!validation.success) {
            return { success: false, error: "Validation failed", details: validation.error.format() };
        }

        const existing = await db.testimonial.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Testimonial not found or unauthorized" };

        const updated = await db.testimonial.update({
            where: { id },
            data: validation.data
        });

        await eventBus.publish("crud.updated", {
            model: "testimonial",
            siteId,
            item: updated
        }, "crud").catch(console.error);

        return { success: true, item: updated };
    } catch (err: any) {
        console.error("[UPDATE_TESTIMONIAL_ACTION] Error:", err);
        return { success: false, error: "Failed to update testimonial" };
    }
}

export async function deleteTestimonialAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const existing = await db.testimonial.findFirst({ where: { id, siteId } });
        if (!existing) return { success: false, error: "Testimonial not found or unauthorized" };

        const deleted = await db.testimonial.delete({ where: { id } });

        await eventBus.publish("crud.deleted", {
            model: "testimonial",
            siteId,
            item: deleted
        }, "crud").catch(console.error);

        return { success: true, item: deleted };
    } catch (err: any) {
        console.error("[DELETE_TESTIMONIAL_ACTION] Error:", err);
        return { success: false, error: "Failed to delete testimonial" };
    }
}

export async function updatePostCategoryAction(postId: string, categoryName: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        const existing = await db.post.findFirst({ where: { id: postId, siteId } });
        if (!existing) return { success: false, error: "Post not found or unauthorized" };

        // Cari atau update metadata category
        const existingCategoryMeta = await db.metaData.findFirst({
            where: { postId, key: "category" }
        });

        if (existingCategoryMeta) {
            await db.metaData.update({
                where: { id: existingCategoryMeta.id },
                data: { value: categoryName }
            });
        } else {
            await db.metaData.create({
                data: {
                    key: "category",
                    value: categoryName,
                    type: "text",
                    postId
                }
            });
        }

        const updatedPost = await db.post.findUnique({
            where: { id: postId },
            include: { metaData: true }
        });

        await eventBus.publish("crud.updated", {
            model: "post",
            siteId,
            item: updatedPost
        }, "crud").catch(console.error);

        return { success: true, item: updatedPost };
    } catch (err: any) {
        console.error("[UPDATE_POST_CATEGORY_ACTION] Error:", err);
        return { success: false, error: "Gagal memperbarui kategori artikel" };
    }
}

export async function searchGlobalAction(q: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor", "user"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!q) return { success: true, results: [] };

        const results = await PostClient.searchAll(siteId, q);
        return { success: true, results };
    } catch (err: any) {
        console.error("[SEARCH_GLOBAL_ACTION] Error:", err);
        return { success: false, error: "Pencarian gagal dilakukan" };
    }
}



export async function getTestimonialAction(id: string) {
    try {
        const { siteId, error } = await getApiContext(["admin", "owner", "editor"]);
        if (error || !siteId) return { success: false, error: error || "Unauthorized" };

        if (!id) return { success: false, error: "ID required" };

        const { db } = await import("@/modules/shared/core/db");
        const testimonial = await db.testimonial.findFirst({ where: { id, siteId } });
        if (!testimonial) return { success: false, error: "Testimonial not found" };

        return { success: true, data: testimonial };
    } catch (err: any) {
        console.error("[GET_TESTIMONIAL_ACTION] Error:", err);
        return { success: false, error: "Gagal mengambil data testimoni" };
    }
}