"use client";

import React from "react";
import Image from "next/image";
import { Trash2, Copy, Loader2 } from "lucide-react";
import { getProxiedUrl } from "@/lib/media/utils";

interface MediaItemCardProps {
    item: any;
    onCopy: (_url: string) => void;
    onDelete: (_item: any) => void;
    isDeleting: boolean;
}

export function MediaItemCard({ item, onCopy, onDelete, isDeleting }: MediaItemCardProps) {
    return (
        <div className="group relative bg-card rounded-md border border-border overflow-hidden transition-all shadow-sm hover:shadow-2xl hover:-translate-y-1">
            <div className="aspect-square bg-muted/5 relative overflow-hidden">
                <Image
                    src={getProxiedUrl(item.url)}
                    alt={item.filename}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                    <button
                        onClick={() => onCopy(item.url)}
                        className="w-10 h-10 flex items-center justify-center bg-background border border-border text-foreground hover:border-primary hover:text-primary rounded transition-all shadow-xl active:scale-95"
                        title="Salin URL"
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(item)}
                        className="w-10 h-10 flex items-center justify-center bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded transition-all shadow-xl active:scale-95"
                        title="Hapus"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Trash2 size={16} />
                        )}
                    </button>
                </div>
            </div>
            <div className="p-2.5 bg-card">
                <p className="text-[10px] font-black text-foreground uppercase tracking-tighter truncate" title={item.filename}>
                    {item.filename}
                </p>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                    {(item.size / 1024).toFixed(1)} KB
                </p>
            </div>
        </div>
    );
}
