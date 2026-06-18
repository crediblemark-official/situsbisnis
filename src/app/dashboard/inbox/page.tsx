import React from "react";
import { Mail, Calendar } from "lucide-react";

import { getSiteId } from "@/lib/domains/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SiteClient } from "@/modules/site";

import InboxActions from "@/modules/site/ui/dashboard/inbox/InboxActions";

export const dynamic = 'force-dynamic';

export default async function InboxPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const siteId = await getSiteId();
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "20");
    const skip = (currentPage - 1) * pageSize;

    const [messages, total] = await Promise.all([
        SiteClient.getContactSubmissions(siteId || "", { skip, take: pageSize }),
        SiteClient.countContactSubmissions(siteId || "")
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-4">
            <PageHeader 
                title="Kotak Pesan" 
                subtitle="Daftar pesan dan pertanyaan dari pengunjung." 
                icon={<Mail />}
            />

            {messages.length === 0 ? (
                <EmptyState 
                    icon={<Mail size={48} className="opacity-10" />} 
                    message="Belum ada pesan yang masuk saat ini." 
                    className="py-32"
                />
            ) : (
                <div className="space-y-4 -mx-3 md:mx-0">
                    {messages.map(msg => (
                        <div key={msg.id} className="bg-card md:rounded-md border-y md:border border-border transition-all overflow-hidden w-full shadow-sm hover:shadow-xl group">
                            <div className="px-3 md:px-5 py-4">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-sm text-foreground tracking-tighter uppercase leading-none">
                                                {msg.subject || "Tanpa Subjek"}
                                            </h3>
                                            <div className="hidden md:block">
                                                <InboxActions id={msg.id} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                                                {msg.name[0]?.toUpperCase() || "?"}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black text-foreground uppercase tracking-tight">
                                                    {msg.name}
                                                </p>
                                                <p className="text-[9px] text-muted-foreground font-medium lowercase opacity-60">
                                                    {msg.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 rounded-md border border-border text-[9px] font-black text-muted-foreground uppercase tracking-widest shadow-sm">
                                        <Calendar size={10} className="opacity-50" />
                                        {new Date(msg.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="p-3 bg-muted/5 rounded-md border border-border/50 text-foreground text-xs leading-[1.6] whitespace-pre-wrap font-medium shadow-inner opacity-90 group-hover:opacity-100 transition-opacity">
                                    {msg.message}
                                </div>
                                <div className="mt-4 md:hidden flex justify-end">
                                    <InboxActions id={msg.id} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    );
}
