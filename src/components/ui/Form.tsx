"use client";

import React, { useId } from "react";
import { CustomSelect } from "./CustomSelect";
import { Switch } from "./Switch";
import { UI_STYLES } from "@/lib/constants/ui";
import { Info } from "lucide-react";
import { Tooltip } from "./Tooltip";

export function FormSection({ 
    title, 
    description, 
    children,
    icon
}: { 
    title: string; 
    description?: string; 
    children: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className={UI_STYLES.card}>
            <div className="p-4 space-y-4">
                <div>
                    <h2 className={UI_STYLES.sectionHeader}>
                        {icon && <span className="text-primary">{icon}</span>}
                        {title}
                    </h2>
                    {description && <p className="text-muted-foreground text-[10px] font-medium leading-relaxed opacity-90">{description}</p>}
                </div>
                <div className="space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function FormLabel({ 
    children, 
    className = "", 
    htmlFor,
    tooltip,
    tooltipPlacement = "top"
}: { 
    children: React.ReactNode; 
    className?: string; 
    htmlFor?: string;
    tooltip?: string;
    tooltipPlacement?: "top" | "bottom";
}) {
    return (
        <div className="flex items-center gap-1.5 mb-1 ml-1">
            <label
                htmlFor={htmlFor}
                className={`text-[9px] font-black text-muted-foreground uppercase tracking-widest block ${className}`}
            >
                {children}
            </label>
            {tooltip && (
                <Tooltip content={tooltip} placement={tooltipPlacement}>
                    <Info size={10} className="text-muted-foreground/40 hover:text-primary transition-colors cursor-help" />
                </Tooltip>
            )}
        </div>
    );
}

export function FormInput({ 
    label, 
    name, 
    value, 
    onChange, 
    placeholder, 
    type = "text",
    required = false,
    className = "",
    disabled = false,
    icon,
    tooltip,
    tooltipPlacement = "top"
}: { 
    label: string; 
    name?: string;
    value?: string;
    onChange?: (_e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    tooltip?: string;
    tooltipPlacement?: "top" | "bottom";
}) {
    const id = useId();
    return (
        <div className={`space-y-1.5 ${className} ${disabled ? 'opacity-50 grayscale' : ''}`}>
            <FormLabel htmlFor={id} tooltip={tooltip} tooltipPlacement={tooltipPlacement}>{label}</FormLabel>
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    className={`${UI_STYLES.input} ${icon ? 'pl-10' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
                />
            </div>
        </div>
    );
}

export function FormSelect({ 
    label, 
    name, 
    value, 
    onChange, 
    options,
    className = "",
    disabled = false,
    tooltip
}: { 
    label: string; 
    name?: string;
    value?: string;
    onChange?: (_val: any) => void;
    options: { label: string; value: string }[];
    className?: string;
    disabled?: boolean;
    tooltip?: string;
}) {
    const id = useId();
    return (
        <div className={`space-y-1.5 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <FormLabel htmlFor={id} className="pl-0.5 !font-bold" tooltip={tooltip}>{label}</FormLabel>
            <CustomSelect
                id={id}
                options={options}
                value={value || ""}
                disabled={disabled}
                onChange={(val) => {
                    if (onChange) {
                        onChange({ target: { name, value: val } } as any);
                    }
                }}
                className="w-full"
            />
        </div>
    );
}

export function FormTextArea({ 
    label, 
    name, 
    value, 
    onChange, 
    placeholder, 
    rows = 3,
    className = "",
    required = false,
    disabled = false,
    tooltip
}: { 
    label: string; 
    name?: string;
    value?: string;
    onChange?: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    required?: boolean;
    disabled?: boolean;
    tooltip?: string;
}) {
    const id = useId();
    return (
        <div className={`space-y-1.5 ${className} ${disabled ? 'opacity-50 grayscale' : ''}`}>
            <FormLabel htmlFor={id} tooltip={tooltip}>{label}</FormLabel>
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                required={required}
                disabled={disabled}
                className={`${UI_STYLES.input} resize-none py-3 ${disabled ? 'cursor-not-allowed' : ''}`}
            />
        </div>
    );
}

export function FormSwitch({ 
    label, 
    description,
    checked, 
    onChange,
    className = "",
    disabled = false,
    tooltip
}: { 
    label: string; 
    description?: string; 
    checked: boolean; 
    onChange: (_checked: boolean) => void;
    className?: string;
    disabled?: boolean;
    tooltip?: string;
}) {
    const id = useId();
    return (
        <div className={`flex items-center justify-between gap-4 ${className} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {(label || description) && (
                <div className="space-y-1">
                    {label && <FormLabel htmlFor={id} className="mb-0 leading-none" tooltip={tooltip}>{label}</FormLabel>}
                    {description && <p className="text-[10px] text-muted-foreground font-medium opacity-80 leading-tight">{description}</p>}
                </div>
            )}
            <Switch 
                id={id}
                checked={checked} 
                onChange={onChange} 
                disabled={disabled} 
            />
        </div>
    );
}
