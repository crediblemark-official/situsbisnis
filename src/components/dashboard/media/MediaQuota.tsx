"use client";

import React from "react";

interface MediaQuotaProps {
    quota: { used: number; max: number } | null;
}

export function MediaQuota({ quota }: MediaQuotaProps) {
    if (!quota || quota.max === -1) return null;

    const isFull = quota.used >= quota.max;
    const percentage = Math.min(100, (quota.used / quota.max) * 100);

    const formattedUsed = quota.used.toFixed(1);
    const formattedMax = quota.max.toFixed(0);

    return (
        <div className="hidden md:flex flex-col gap-1 w-48 animate-in slide-in-from-right-4 duration-1000">
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Kuota Penyimpanan</span>
                <span className={isFull ? "text-destructive" : "text-primary"}>
                    {formattedUsed} MB / {formattedMax} MB
                </span>
            </div>
            <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden border border-border/50">
                <div 
                    className={`h-full transition-all duration-1000 ${isFull ? "bg-destructive" : "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
