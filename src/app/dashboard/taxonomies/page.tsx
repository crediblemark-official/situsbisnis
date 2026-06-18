import React from "react";

import { Plus, Layers } from "lucide-react";
import { db } from "@/lib/core/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import TaxonomyList from "@/modules/page/ui/dashboard/taxonomies/TaxonomyList.client";

export const dynamic = 'force-dynamic';

export default async function TaxonomiesPage() {
    const { getSiteId } = await import("@/lib/domains/tenant");
    const siteId = await getSiteId();
    const taxonomies = await db.taxonomy.findMany({
        where: siteId ? { siteId } : {},
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            _count: {
                select: { terms: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            <PageHeader 
                title="Kategori & Tag" 
                subtitle="Kelola pengelompokan konten situs Anda."
                icon={<Layers />}
            >
                <LinkButton
                    href="/dashboard/taxonomies/new"
                    icon={<Plus size={14} />}
                >
                    Tambah
                </LinkButton>
            </PageHeader>

            <TaxonomyList taxonomies={taxonomies as any} />
        </div>
    );
}
