"use client";

import React from "react";
import { UI_STYLES } from "@/lib/constants/ui";

export function StatusBadge({ 
    type, 
    label,
    className = ""
}: { 
    type: "success" | "warning" | "error" | "info" | "neutral" | "primary" | "secondary";
    label: string | React.ReactNode;
    className?: string;
}) {
    const variants = {
        success: "bg-emerald-500/5 text-emerald-500 border-emerald-500/10",
        warning: "bg-amber-500/5 text-amber-500 border-amber-500/10",
        error: "bg-red-500/5 text-red-500 border-red-500/10",
        info: "bg-blue-500/5 text-blue-400 border-blue-500/10",
        primary: "bg-primary/5 text-primary border-primary/10",
        secondary: "bg-purple-500/5 text-purple-400 border-purple-500/10",
        neutral: "bg-muted/20 text-foreground border-border",
    };

    return (
        <span className={`${UI_STYLES.badge} ${variants[type]} ${className}`}>
            {label}
        </span>
    );
}
