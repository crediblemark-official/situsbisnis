import React from "react";
import { Image as ImageIcon } from "lucide-react";

import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import GalleryList from "@/modules/media/ui/dashboard/gallery/GalleryList.client";
import GalleryForm from "@/modules/media/ui/dashboard/gallery/GalleryForm.client";

export const dynamic = 'force-dynamic';

export default async function GalleryDashboard({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const siteId = await getSiteId();
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "24");
    const skip = (currentPage - 1) * pageSize;

    const [items, total] = await Promise.all([
        db.galleryItem.findMany({
            where: siteId ? { siteId } : {},
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: skip,
            select: {
                id: true,
                url: true,
                title: true,
                description: true,
                createdAt: true,
                siteId: true,
            }
        }),
        db.galleryItem.count({ where: siteId ? { siteId } : {} })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-4">
            <PageHeader 
                title="Galeri" 
                subtitle="Manajemen aset visual dan koleksi gambar."
                icon={<ImageIcon />}
            />

            <GalleryForm />

            <GalleryList items={items as any} />

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    );
}
