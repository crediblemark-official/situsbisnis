"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface ShareLinkPillProps {
    baseUrl: string;
}

export function ShareLinkPill({ baseUrl }: ShareLinkPillProps) {
    const [copied, setCopied] = useState(false);

    // Normalize URL
    const hasProtocol = baseUrl.startsWith("http://") || baseUrl.startsWith("https://");
    const formattedBaseUrl = hasProtocol ? baseUrl : `http://${baseUrl}`;
    const fullUrl = `${formattedBaseUrl}/submit-testimonial`;

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(fullUrl);
            setCopied(true);
            toast.success("Tautan berhasil disalin!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
            toast.error("Gagal menyalin tautan.");
        }
    };

    return (
        <div className="flex items-center gap-1.5 w-full md:w-auto">
            {/* Clickable link box */}
            <div className="flex-1 md:flex-initial flex items-center px-3 py-1.5 bg-muted/20 rounded-md border border-border/50 text-foreground font-mono text-[9px] tracking-tight hover:border-primary/30 transition-all select-all">
                <span className="opacity-40 mr-2 flex-shrink-0">URI://</span>
                <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline hover:text-primary transition-colors flex items-center gap-1 font-semibold truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]"
                    title="Buka tautan di tab baru"
                >
                    {fullUrl}
                    <ExternalLink size={8} className="opacity-50 hover:opacity-100 flex-shrink-0" />
                </a>
            </div>

            {/* Quick copy button */}
            <button
                type="button"
                onClick={handleCopy}
                className={`p-1.5 rounded-md border text-[9px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 flex-shrink-0 ${
                    copied
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-background border-border/50 hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                }`}
                title="Salin tautan ke papan klip"
            >
                {copied ? (
                    <>
                        <Check size={11} className="animate-in zoom-in duration-200" />
                        <span className="text-[8px] uppercase tracking-wider px-0.5">Tersalin</span>
                    </>
                ) : (
                    <>
                        <Copy size={11} />
                        <span className="text-[8px] uppercase tracking-wider px-0.5">Salin</span>
                    </>
                )}
            </button>
        </div>
    );
}
