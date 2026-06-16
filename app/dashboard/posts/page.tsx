import React from "react";

import { Plus, Newspaper } from "lucide-react";
import { db } from "@/lib/core/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { LinkButton } from "@/components/ui/LinkButton";
import PostList from "./PostList.client";

import { getSiteId } from "@/lib/domains/tenant";


export const dynamic = 'force-dynamic';

export default async function PostsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const siteId = await getSiteId();
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "50");
    const skip = (currentPage - 1) * pageSize;
    
    if (!siteId) {
        // ...
    }

    const [allPosts, total] = await Promise.all([
        db.post.findMany({
            where: siteId ? { siteId } : {},
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: skip,
            select: {
                id: true,
                title: true,
                slug: true,
                published: true,
                createdAt: true,
                metaData: {
                    select: {
                        key: true,
                        value: true
                    }
                }
            }
        }),
        db.post.count({ where: siteId ? { siteId } : {} })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="animate-in fade-in duration-700 pb-20 space-y-4">
            <PageHeader 
                title="Artikel" 
                subtitle="Kelola semua konten dan berita di situs Anda."
                icon={<Newspaper />}
            >
                <LinkButton
                    href="/dashboard/posts/new"
                    icon={<Plus size={14} className="mr-1 md:mr-2" />}
                >
                    <span className="hidden sm:inline">Buat </span>Artikel
                </LinkButton>
            </PageHeader>

            <PostList posts={allPosts as any} />

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    );
}
