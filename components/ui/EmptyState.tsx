"use client";

import React from "react";
import { UI_STYLES } from "@/lib/constants/ui";

export function EmptyState({ 
    icon, 
    message = "No data available in this section.",
    className = ""
}: { 
    icon?: React.ReactNode; 
    message?: string; 
    className?: string;
}) {
    return (
        <div className={`${UI_STYLES.cardWithPadding} ${className}`}>
            {icon && <div className="mx-auto mb-4 text-muted-foreground/40 flex justify-center" aria-hidden="true">{icon}</div>}
            <p className="text-muted-foreground text-xs font-medium italic tracking-tight">{message}</p>
        </div>
    );
}
