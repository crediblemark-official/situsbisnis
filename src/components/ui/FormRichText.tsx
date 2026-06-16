import React from "react";
import dynamic from "next/dynamic";
import { FormLabel } from "./Form";

const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[500px] bg-muted/5 animate-pulse rounded-xl border border-border/50 flex items-center justify-center">
            <span className="text-xs font-semibold text-muted-foreground">Memuat editor...</span>
        </div>
    )
});

interface FormRichTextProps {
    label: string;
    value: string;
    onChange: (_value: string) => void;
    minHeight?: string;
    className?: string;
    tooltip?: string;
    fallbackContent?: React.ReactNode;
}

export function FormRichText({
    label,
    value,
    onChange,
    minHeight = "min-h-[500px]",
    className = "",
    tooltip,
    fallbackContent
}: FormRichTextProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            <FormLabel tooltip={tooltip}>{label}</FormLabel>
            <div className={`bg-card/50 rounded-xl border border-border/50 overflow-hidden ${minHeight}`}>
                {fallbackContent ? fallbackContent : (
                    <TiptapEditor
                        content={value}
                        onChange={onChange}
                    />
                )}
            </div>
        </div>
    );
}
