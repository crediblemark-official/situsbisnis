import React from "react";
import { 
    Plus, 
    LayoutPanelLeft, 
    Settings
} from "lucide-react";

import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pagination } from "@/components/ui/Pagination";
import PageList from "./PageList.client";

export const dynamic = 'force-dynamic';

export default async function PagesDashboard({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const siteId = await getSiteId();
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "50");
    const skip = (currentPage - 1) * pageSize;

    const [pages, total] = await Promise.all([
        db.credBuildPage.findMany({
            where: siteId ? { siteId } : {},
            orderBy: { updatedAt: 'desc' },
            take: pageSize,
            skip: skip,
            select: {
                id: true,
                path: true,
                title: true,
                description: true,
                isPublished: true,
                useBuilder: true,
                updatedAt: true
            }
        }),
        db.credBuildPage.count({ where: siteId ? { siteId } : {} })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-4">
            <PageHeader 
                title="Daftar Halaman" 
                subtitle="Kelola konten dan tata letak halaman situs Anda."
                icon={<LayoutPanelLeft />}
            >
                <LinkButton 
                    href="/dashboard/pages/new?mode=visual" 
                    icon={<Plus size={14} className="mr-1 md:mr-2" />}
                >
                    <span className="hidden xs:inline">Buat </span> Halaman
                </LinkButton>
            </PageHeader>

            <PageList pages={pages as any} />

            <Pagination currentPage={currentPage} totalPages={totalPages} />

            {/* Hint Section */}
            <div className="flex items-center gap-4 px-5 py-3 bg-card border border-border/50 rounded-md text-[9px] text-muted-foreground font-bold shadow-sm">
                <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center border border-primary/10 flex-shrink-0">
                    <Settings size={14} className="text-primary" />
                </div>
                <div className="space-y-0.5">
                    <div>Info: Halaman dengan Editor Visual lebih mudah diedit secara langsung. Sinkronisasi metadata disarankan untuk SEO.</div>
                    <div className="text-primary font-black uppercase tracking-wider text-[8px] flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span>Penting: Untuk menjadikan halaman sebagai Landing Page Utama / Beranda (Home), gunakan alamat/slug <code className="font-mono bg-primary/10 px-1 py-0.5 rounded text-[9px] font-bold">/</code></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
