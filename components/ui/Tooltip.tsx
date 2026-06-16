"use client";

import React, { useState, useId } from "react";

export function Tooltip({ 
    children, 
    content,
    className = "",
    placement = "top"
}: { 
    children: React.ReactNode; 
    content: string | React.ReactNode;
    className?: string;
    placement?: "top" | "bottom";
}) {
    const [isVisible, setIsVisible] = useState(false);
    const id = useId();
    const tooltipId = `tooltip-${id}`;

    const placementClasses = placement === "bottom"
        ? "absolute top-full left-1/2 -translate-x-1/2 mt-2.5 z-[9999] w-64 pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200"
        : "absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-[9999] w-64 pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200";

    const arrowClasses = placement === "bottom"
        ? "absolute bottom-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-l border-t border-border/50 rotate-45 -mb-1"
        : "absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border/50 rotate-45 -mt-1";

    return (
        <div 
            className={`relative inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-sm ${className}`}
            tabIndex={0}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            aria-describedby={isVisible ? tooltipId : undefined}
        >
            {children}
            {isVisible && (
                <div 
                    id={tooltipId}
                    role="tooltip"
                    className={placementClasses}
                >
                    <div className="relative bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl rounded-xl p-3 text-[11px] font-medium text-muted-foreground leading-relaxed">
                        {content}
                        <div className={arrowClasses} />
                    </div>
                </div>
            )}
        </div>
    );
}
