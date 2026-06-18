import { db } from "@/modules/shared/core/db";

export async function countPosts(siteId: string, where?: any) {
    return db.post.count({ where: { siteId, ...(where || {}) } });
}

export async function findPosts(siteId: string, pagination: { skip: number; take: number }, where?: any, select?: any) {
    return db.post.findMany({
        where: { siteId, ...(where || {}) },
        orderBy: { createdAt: 'desc' },
        take: pagination.take,
        skip: pagination.skip,
        ...(select ? { select } : {})
    });
}

export async function findPostById(id: string, siteId: string) {
    return db.post.findFirst({
        where: { id, siteId },
        include: { metaData: true }
    });
}

export async function createPost(data: any, siteId: string) {
    return db.post.create({
        data: { ...data, siteId, updatedAt: new Date() }
    });
}

export async function updatePost(id: string, siteId: string, data: any) {
    return db.post.update({
        where: { id },
        data: { ...data, updatedAt: new Date() }
    });
}

export async function deletePost(id: string, _siteId: string) {
    return db.post.delete({ where: { id } });
}
