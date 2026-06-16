"use client";

import React from "react";

interface SwitchProps {
    checked: boolean;
    onChange: (_checked: boolean) => void;
    disabled?: boolean;
    className?: string;
    id?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
}

export function Switch({ 
    checked, 
    onChange, 
    disabled = false, 
    className = "",
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby
}: SwitchProps) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
                group relative inline-flex h-4 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent 
                transition-all duration-300 outline-none
                focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50
                ${checked 
                    ? 'bg-primary shadow-lg shadow-primary/20' 
                    : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                } 
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''} 
                ${className}
            `}
        >
            {/* Text Labels inside track - Hidden from Screen Readers since they are purely aesthetic and tiny (6px) */}
            <span 
                aria-hidden="true"
                className={`absolute left-1 text-[6px] font-black uppercase transition-all duration-300 ${
                    checked ? 'opacity-100 text-primary-foreground' : 'opacity-0'
                }`}
            >
                ON
            </span>
            <span 
                aria-hidden="true"
                className={`absolute right-1 text-[6px] font-black uppercase transition-all duration-300 ${
                    checked ? 'opacity-0' : 'opacity-100 text-muted-foreground'
                }`}
            >
                OFF
            </span>

            {/* Handle */}
            <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    checked ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}
