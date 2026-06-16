"use client";

import React from "react";
import Link from "next/link";

export function StatCard({ 
    title, 
    value, 
    icon,
    description
}: { 
    title: string; 
    value: string | number; 
    icon?: React.ReactNode;
    description?: string;
}) {
    return (
        <div className="relative overflow-hidden bg-card p-4 rounded-md border border-border hover:border-primary/30 transition-all group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:bg-primary/10 transition-all" />
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black text-foreground/70 uppercase tracking-[0.2em]">{title}</span>
                {icon && <div className="text-primary scale-90" aria-hidden="true">{icon}</div>}
            </div>
            <h4 className="text-xl font-black text-foreground tracking-tighter mb-0.5">{value}</h4>
            {description && <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{description}</p>}
        </div>
    );
}

export function QuickAction({ 
    href, 
    label, 
    icon 
}: { 
    href: string; 
    label: string; 
    icon?: React.ReactNode 
}) {
    return (
        <Link href={href} className="flex items-center justify-center gap-2 p-2 bg-card border border-border rounded text-[11px] font-bold text-foreground hover:border-muted-foreground/30 transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none">
            {icon && <span aria-hidden="true">{icon}</span>} {label}
        </Link>
    );
}

export function LibraryItem({ 
    label, 
    value, 
    icon, 
    href 
}: { 
    label: string; 
    value: number | string; 
    icon?: React.ReactNode; 
    href: string 
}) {
    return (
        <Link href={href} className="flex items-center justify-between p-2.5 hover:bg-muted/10 transition-colors group focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none">
            <div className="flex items-center gap-3">
                {icon && <div className="text-foreground opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true">{icon}</div>}
                <span className="text-xs font-medium text-foreground group-hover:text-foreground">{label}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/60">{value}</span>
        </Link>
    );
}
