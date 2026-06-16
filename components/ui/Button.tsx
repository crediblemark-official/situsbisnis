"use client";

import React from "react";
import { UI_STYLES } from "@/lib/constants/ui";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const variantClass = {
        primary: UI_STYLES.buttonPrimary,
        secondary: UI_STYLES.buttonSecondary,
        ghost: UI_STYLES.buttonGhost,
        danger: UI_STYLES.buttonDanger,
        outline: "border border-border hover:bg-muted/10 text-foreground",
    }[variant];

    const sizeClass = {
        sm: "px-2.5 py-1 text-[9px]",
        md: "px-4 py-1.5 text-[10px]",
        lg: "px-6 py-2 text-[11px]",
    }[size];

    return (
        <button
            disabled={disabled || loading}
            aria-busy={loading ? "true" : undefined}
            aria-live={loading ? "polite" : undefined}
            className={`${UI_STYLES.buttonBase} ${variantClass} ${sizeClass} ${className}`}
            {...props}
        >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {!loading && icon && <span className="flex-shrink-0">{icon}</span>}
            <span className={loading ? "opacity-70" : ""}>{children}</span>
        </button>
    );
}
