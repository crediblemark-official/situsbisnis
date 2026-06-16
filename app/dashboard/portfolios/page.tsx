import React from "react";
import { Plus, Briefcase } from "lucide-react";

import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { Pagination } from "@/components/ui/Pagination";
import PortfolioList from "./PortfolioList.client";

export const dynamic = 'force-dynamic';

export default async function PortfolioDashboard({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const siteId = await getSiteId();
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "12");
    const skip = (currentPage - 1) * pageSize;

    const [items, total] = await Promise.all([
        db.portfolioItem.findMany({
            where: siteId ? { siteId } : {},
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: skip,
            select: {
                id: true,
                title: true,
                category: true,
                imageUrl: true,
                link: true,
                description: true,
                createdAt: true,
                siteId: true,
            }
        }),
        db.portfolioItem.count({ where: siteId ? { siteId } : {} })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-4">
            <PageHeader 
                title="Daftar Proyek" 
                subtitle="Koleksi hasil karya dan inovasi terbaik"
                icon={<Briefcase />}
            >
                <LinkButton
                    href="/dashboard/portfolios/new"
                    icon={<Plus size={14} className="mr-2" />}
                >
                    Tambah Proyek
                </LinkButton>
            </PageHeader>

            <PortfolioList items={items as any} />

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    );
}
