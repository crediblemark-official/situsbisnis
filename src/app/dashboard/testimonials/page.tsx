import React from "react";
import { Plus, ExternalLink, MessageSquare } from "lucide-react";
import { db } from "@/lib/core/db";
import { getSiteId } from "@/lib/domains/tenant";
import TestimonialCard from "@/modules/post/ui/dashboard/testimonials/TestimonialCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { LinkButton } from "@/components/ui/LinkButton";
import { ShareLinkPill } from "@/modules/post/ui/dashboard/testimonials/ShareLinkPill";

export const dynamic = 'force-dynamic';

export default async function TestimonialsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "50");
    const skip = (currentPage - 1) * pageSize;

    const siteId = await getSiteId();

    // Build the correct tenant URL (subdomain or custom domain)
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
    const isLocal = rootDomain.includes("localhost");
    const protocol = isLocal ? "http" : "https";
    let tenantBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${rootDomain}`;

    if (siteId) {
        const siteInfo = await db.site.findUnique({
            where: { id: siteId },
            select: { subdomain: true, customDomain: true, customDomainVerified: true }
        });
        if (siteInfo) {
            // Prefer custom domain if verified, else use subdomain
            const domain = (siteInfo.customDomain && siteInfo.customDomainVerified)
                ? siteInfo.customDomain
                : `${siteInfo.subdomain}.${rootDomain}`;
            tenantBaseUrl = `${protocol}://${domain}`;
        }
    }

    const [allTestimonials, total] = await Promise.all([
        db.testimonial.findMany({
            where: siteId ? { siteId } : {},
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: skip,
            select: {
                id: true,
                quote: true,
                author: true,
                role: true,
                avatarUrl: true,
                rating: true,
                isApproved: true,
                createdAt: true,
                siteId: true,
            }
        }),
        db.testimonial.count({ where: siteId ? { siteId } : {} })
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-4">
            <PageHeader 
                title="Testimoni" 
                subtitle="Kelola ulasan dan suara pelanggan Anda."
                icon={<MessageSquare />}
            >
                <LinkButton
                    href="/dashboard/testimonials/new"
                    icon={<Plus size={14} className="mr-2" />}
                >
                    Tambah
                </LinkButton>
            </PageHeader>

            <div className="bg-card border border-border/50 rounded-md p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-inner group-hover:scale-105 transition-transform">
                        <ExternalLink className="text-primary" size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-[10px] uppercase tracking-widest mb-1">Tautan Pengiriman</h3>
                        <p className="text-muted-foreground text-[9px] font-medium opacity-60 italic">Gunakan tautan ini untuk menerima testimoni dari pelanggan.</p>
                    </div>
                </div>
                <ShareLinkPill baseUrl={tenantBaseUrl} />
            </div>

            {
                allTestimonials.length === 0 ? (
                    <EmptyState 
                        icon={<MessageSquare size={32} />} 
                        message="Belum ada testimoni. Siap menambah ulasan pertama?" 
                        className="py-20"
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {allTestimonials.map((item) => (
                            <TestimonialCard key={item.id} testimonial={item} />
                        ))}
                    </div>
                )
            }

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div >
    );
}
