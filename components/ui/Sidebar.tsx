"use client";

import React from "react";

interface SidebarSectionProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
    showDivider?: boolean;
}

export function SidebarSection({ 
    title, 
    children, 
    className = "", 
    showDivider = false 
}: SidebarSectionProps) {
    return (
        <div className={`space-y-3 ${showDivider ? "pt-3 border-t border-border/50" : ""} ${className}`}>
            {title && (
                <h4 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    {title}
                </h4>
            )}
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
}

interface SidebarFieldProps {
    label: string;
    htmlFor?: string;
    children: React.ReactNode;
    className?: string;
}

export function SidebarField({ 
    label, 
    htmlFor, 
    children, 
    className = "" 
}: SidebarFieldProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label htmlFor={htmlFor} className="text-[10px] font-semibold text-muted-foreground ml-1">
                {label}
            </label>
            {children}
        </div>
    );
}

interface SidebarInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    symbol?: string;
}

export function SidebarInput({ 
    icon, 
    symbol, 
    className = "", 
    ...props 
}: SidebarInputProps) {
    return (
        <div className="relative">
            {(icon || symbol) && (
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground/40 border-r border-border/50 pr-2" aria-hidden="true">
                    {symbol ? (
                        <span className="text-[10px] font-bold">{symbol}</span>
                    ) : (
                        icon
                    )}
                </div>
            )}
            <input
                className={`
                    w-full px-3 py-1.5 bg-background border border-border/50 rounded-md 
                    text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary/20 focus:border-primary/50 
                    focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/50
                    transition-all outline-none shadow-sm placeholder:text-muted-foreground/30
                    ${(icon || symbol) ? "pl-10" : ""}
                    ${className}
                `}
                {...props}
            />
        </div>
    );
}
