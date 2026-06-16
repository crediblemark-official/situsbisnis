"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Briefcase, ExternalLink, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

type PortfolioItem = {
    id: string;
    title: string;
    category: string;
    imageUrl: string;
    link: string;
    description: string;
};

export default function PortfolioList({ items }: { items: PortfolioItem[] }) {
    const router = useRouter();

    const parseDescription = (desc: string) => {
        try {
            const json = JSON.parse(desc);
            const extractText = (node: any): string => {
                if (node.type === 'text') return node.text;
                if (node.content) return node.content.map(extractText).join(' ');
                return '';
            };
            return extractText(json);
        } catch (_e) {
            return desc;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/portfolios/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Proyek berhasil dihapus");
                router.refresh();
            } else {
                toast.error("Gagal menghapus proyek");
            }
        } catch (_e) {
            toast.error("Terjadi kesalahan saat menghapus");
        }
    };

    if (items.length === 0) {
        return (
            <EmptyState 
                icon={<Briefcase size={48} className="opacity-10" />} 
                message="Belum ada proyek portofolio. Mulai tampilkan karya terbaik Anda." 
                className="py-20"
            />
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map(item => (
                <div key={item.id} className="bg-card p-2.5 rounded-md border border-border/50 flex flex-col gap-3 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 group hover:border-primary/40">
                    <div className="relative w-full h-24 rounded border border-border/50 bg-muted/10">
                        {item.imageUrl && item.imageUrl !== "#" ? (
                            <Image src={item.imageUrl} alt={item.title} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                <Briefcase size={32} />
                            </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <ConfirmActionButton
                                icon={<Trash2 size={14} />}
                                title="Hapus Proyek"
                                confirmTitle="Hapus Proyek?"
                                confirmMessage="Hapus proyek ini? Tindakan ini tidak bisa dibatalkan."
                                confirmText="Ya, Hapus Proyek"
                                variant="danger"
                                onConfirm={() => handleDelete(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-destructive/10 backdrop-blur-md border border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded transition-all shadow-lg"
                            />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2 px-1">
                        <div className="space-y-0.5">
                            <h3 className="font-bold text-foreground text-[11px] tracking-tight uppercase group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-primary/40" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">
                                    {item.category}
                                </span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-[9px] font-medium leading-relaxed line-clamp-2 opacity-60">
                            {parseDescription(item.description)}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/30">
                            <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/30">
                                ID: {item.id.slice(0, 8)}
                            </span>
                            <div className="flex items-center gap-3">
                                <Link href={`/dashboard/portfolios/${item.id}`} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                                    <Edit2 size={12} />
                                </Link>
                                {item.link && (
                                    <a href={item.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
