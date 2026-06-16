"use client";

import React from "react";
import Link from "next/link";
import { Zap, Plus } from "lucide-react";

interface EmptyStateCardProps {
    isLimitReached: boolean;
}

export function EmptyStateCard({ isLimitReached }: EmptyStateCardProps) {
    if (isLimitReached) {
        return (
            <Link
                href="/dashboard/billing"
                className="flex flex-col items-center justify-center border-2 border-dashed border-amber-500/30 rounded-md p-6 bg-amber-500/[0.02] transition-all group min-h-[200px] relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] to-transparent opacity-50" />
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-6 relative z-10">
                    <Zap className="text-amber-500" size={24} />
                </div>
                <h4 className="text-sm font-black text-amber-500 mb-2 uppercase tracking-widest relative z-10">Limit Tercapai</h4>
                <p className="text-[10px] text-muted-foreground text-center px-6 font-medium leading-relaxed opacity-80 relative z-10">
                    Anda telah menggunakan seluruh slot situs di paket saat ini. Klik untuk upgrade limit.
                </p>
            </Link>
        );
    }

    return (
        <Link
            href="/onboarding"
            className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-md p-6 hover:border-primary/30 hover:bg-primary/5 transition-all group min-h-[200px]"
        >
            <div className="w-16 h-16 bg-muted/10 border border-border rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                <Plus className="text-muted-foreground group-hover:text-primary transition-all" size={24} />
            </div>
            <h4 className="text-sm font-black text-foreground mb-2 uppercase tracking-widest">Buat Situs Baru</h4>
            <p className="text-[10px] text-muted-foreground text-center px-6 font-medium leading-relaxed opacity-60">
                Siap membangun website baru? Klik di sini untuk memulai.
            </p>
        </Link>
    );
}
