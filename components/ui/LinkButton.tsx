import React from "react";
import Link from "next/link";
import { UI_STYLES } from "@/lib/constants/ui";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface LinkButtonProps {
    href: string;
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
    icon?: React.ReactNode;
    target?: string;
}

export function LinkButton({
    href,
    children,
    variant = "primary",
    size = "md",
    className = "",
    icon,
    target,
    ...props
}: LinkButtonProps) {
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
        <Link
            href={href}
            target={target}
            className={`${UI_STYLES.buttonBase} ${variantClass} ${sizeClass} transition-all active:scale-95 ${className}`}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{children}</span>
        </Link>
    );
}
