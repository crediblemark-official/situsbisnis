"use client";

import React from "react";
import Link from "next/link";
import { LayoutPanelLeft, ExternalLink, Save } from "lucide-react";

interface VisualBuilderInfoProps {
    pageId?: string;
    path: string;
    getVisualBuilderPath: (_path: string) => string;
}

export function VisualBuilderInfo({ pageId, path, getVisualBuilderPath }: VisualBuilderInfoProps) {
    return (
        <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden flex flex-col items-center justify-center py-10 px-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <LayoutPanelLeft size={24} />
            </div>
            <div className="space-y-2 max-w-md">
                <h3 className="text-sm font-bold text-foreground">Visual Editor Aktif</h3>
                <p className="text-[10px] text-muted-foreground font-medium opacity-60">
                    Editor teks standar dinonaktifkan karena halaman ini dikelola menggunakan Visual Editor.
                </p>
            </div>
            {pageId ? (
                <Link 
                    href={getVisualBuilderPath(path)}
                    className="flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                    <ExternalLink size={14} className="mr-3" />
                    Buka Visual Editor
                </Link>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <button 
                        type="submit"
                        className="flex items-center px-6 py-2.5 bg-white/5 border border-primary/30 text-primary rounded-xl text-[10px] font-black hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                    >
                        <Save size={14} className="mr-3" />
                        Simpan & Buka Visual Editor
                    </button>
                </div>
            )}
        </div>
    );
}
