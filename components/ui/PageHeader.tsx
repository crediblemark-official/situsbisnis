"use client";

import React from "react";

export function PageHeader({ 
    title, 
    subtitle, 
    icon,
    children,
    className = ""
}: { 
    title: string; 
    subtitle?: string; 
    icon?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}) {
    const baseClass = "sticky top-0 z-20 flex items-center justify-between h-[55px] mb-6 md:mb-8 bg-background/80 backdrop-blur-md border-b border-border/50 -mx-3 md:-mx-5 px-3 md:px-5 animate-in fade-in slide-in-from-top-1 duration-500";

    return (
        <div className={`${baseClass} ${className}`.trim()}>
            <div className="flex items-center gap-3">
                {icon ? (
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary shadow-sm border border-primary/10 transition-transform hover:scale-105">
                        {React.isValidElement(icon) 
                            ? React.cloneElement(icon as React.ReactElement<any>, { 
                                size: 16,
                                ...(icon.props as any) // Preserve original props
                              }) 
                            : icon}
                    </div>
                ) : null}
                <div>
                    <h1 className="text-sm font-black text-foreground tracking-tighter uppercase leading-tight">{title}</h1>
                    {subtitle ? (
                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5 opacity-80 hidden md:block">{subtitle}</p>
                    ) : null}
                </div>
            </div>
            {children ? (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
