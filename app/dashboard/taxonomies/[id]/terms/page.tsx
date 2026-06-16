
import React from "react";
import { db } from "@/lib/core/db";
import TermsClient from "./TermsClient.client";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ManageTermsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const taxonomy = await db.taxonomy.findUnique({
        where: { id }
    });

    if (!taxonomy) {
        return notFound();
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20">
            <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard/taxonomies" className="text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                </Link>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Back to Taxonomies</span>
            </div>

            <PageHeader 
                title={`Manage ${taxonomy.name}`}
                subtitle={`Create and organize individual terms within the ${taxonomy.name} classification.`}
            />

            <TermsClient taxonomyId={id} />
        </div>
    );
}
