"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface MediaBreadcrumbsProps {
    path: any[];
    currentFolderId: string;
    onNavigateRoot: () => void;
    onNavigateFolder: (_folder: any, _index: number) => void;
}

export function MediaBreadcrumbs({ path, currentFolderId, onNavigateRoot, onNavigateFolder }: MediaBreadcrumbsProps) {
    return (
        <div className="flex items-center gap-3 mb-6 py-3 px-2 border-b border-border/50">
            <button 
                onClick={onNavigateRoot}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${currentFolderId === "root" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
                Utama
            </button>
            {path.map((p, i) => (
                <React.Fragment key={p.id}>
                    <ChevronRight size={12} className="text-muted-foreground/30" />
                    <button 
                        onClick={() => onNavigateFolder(p, i)}
                        className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all ${currentFolderId === p.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {p.name}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}
