"use client";

import React, { useId } from "react";
import { MediaPickerField } from "@/components/credbuild/MediaPickerField";
import { Tooltip } from "./Tooltip";
import { Info } from "lucide-react";

interface FormMediaPickerProps {
    label: string;
    value: string;
    onChange: (_value: string) => void;
    tooltip?: string;
    className?: string;
    disabled?: boolean;
    variant?: "default" | "compact" | "logo" | "favicon";
    description?: string;
}

export function FormMediaPicker({
    label,
    value,
    onChange,
    tooltip,
    className = "",
    disabled = false,
    variant = "default",
    description
}: FormMediaPickerProps) {
    const id = useId();

    return (
        <div className={`space-y-1.5 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-1.5 mb-1 ml-1">
                <label
                    htmlFor={id}
                    className="text-[9px] font-bold text-muted-foreground block"
                >
                    {label}
                </label>
                {tooltip && (
                    <Tooltip content={tooltip}>
                        <Info size={10} className="text-muted-foreground/40 hover:text-primary transition-colors cursor-help" />
                    </Tooltip>
                )}
            </div>
            
            <MediaPickerField 
                value={value}
                onChange={onChange}
                variant={variant}
                id={id}
                disabled={disabled}
            />

            {description && (
                <p className="text-[10px] text-muted-foreground/80 mt-1.5 leading-normal italic">
                    {description}
                </p>
            )}
        </div>
    );
}
