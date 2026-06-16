"use client";

import React from "react";
import { Folder, Trash2 } from "lucide-react";

interface MediaFolderCardProps {
    folder: any;
    onNavigate: (_folder: any) => void;
    onDelete: (_folder: any) => void;
}

export function MediaFolderCard({ folder, onNavigate, onDelete }: MediaFolderCardProps) {
    return (
        <div 
            onDoubleClick={() => onNavigate(folder)}
            className="group relative bg-card rounded-md border border-border hover:border-primary/50 transition-all cursor-pointer p-2.5 shadow-sm hover:shadow-xl hover:-translate-y-1"
        >
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/5 rounded flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                    <Folder size={24} fill="currentColor" fillOpacity={0.15} />
                </div>
                <div className="text-center w-full">
                    <p className="text-[11px] font-black text-foreground uppercase tracking-tighter truncate px-2">{folder.name}</p>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                        {folder._count?.items || 0} Aset
                    </p>
                </div>
            </div>
            
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onDelete(folder);
                }}
                className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-destructive/10"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}
