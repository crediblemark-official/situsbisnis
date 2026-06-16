"use client";

import React, { useState } from "react";
import { Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export interface SeoCheck {
    id: string;
    label: string;
    isValid: boolean;
    points: number;
    tip: string;
}

interface SeoScoreIndicatorProps {
    checks: SeoCheck[];
}

export function SeoScoreIndicator({ checks }: SeoScoreIndicatorProps) {
    const [showBreakdown, setShowBreakdown] = useState(false);

    const score = checks.reduce((acc, curr) => acc + (curr.isValid ? curr.points : 0), 0);

    const getScoreTheme = (s: number) => {
        if (s < 50) return {
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/25",
            stroke: "stroke-rose-500",
            text: "text-rose-700 dark:text-rose-300",
            label: "Butuh Perbaikan",
            gradient: "from-rose-500 to-orange-500"
        };
        if (s < 80) return {
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/25",
            stroke: "stroke-amber-500",
            text: "text-amber-700 dark:text-amber-300",
            label: "Cukup Baik",
            gradient: "from-amber-500 to-yellow-500"
        };
        return {
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/25",
            stroke: "stroke-emerald-500",
            text: "text-emerald-700 dark:text-emerald-300",
            label: "Sangat Baik",
            gradient: "from-emerald-500 to-teal-500"
        };
    };

    const theme = getScoreTheme(score);
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className={`p-3.5 rounded-xl border ${theme.border} ${theme.bg} transition-all duration-500 space-y-3 shadow-sm relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${theme.gradient} opacity-[0.03] rounded-full blur-xl`} />
            
            <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                className="stroke-muted-foreground/10 fill-none"
                                strokeWidth="3.5"
                            />
                            <circle
                                cx="22"
                                cy="22"
                                r={radius}
                                className={`${theme.stroke} fill-none transition-all duration-700 ease-out`}
                                strokeWidth="3.5"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className={`absolute text-[10px] font-black tracking-tighter ${theme.color}`}>
                            {score}%
                        </span>
                    </div>

                    <div>
                        <h5 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/75 leading-none">Skor SEO</h5>
                        <p className={`text-[11px] font-black leading-none mt-1 ${theme.text}`}>
                            {theme.label}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none shrink-0"
                    aria-label="Toggle SEO breakdown"
                    aria-expanded={showBreakdown}
                >
                    {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${showBreakdown ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="pt-2.5 border-t border-border/30 space-y-2.5">
                    {checks.map((check) => (
                        <div
                            key={check.id}
                            tabIndex={0}
                            role="document"
                            className="flex gap-2 items-start text-left group/item focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:outline-none rounded px-1 -mx-1 transition-all duration-200"
                        >
                            <div className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                                check.isValid ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted-foreground/10 text-muted-foreground/40'
                            } transition-colors`}>
                                {check.isValid ? (
                                    <Check size={8} className="stroke-[3]" />
                                ) : (
                                    <AlertCircle size={8} />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <p className={`text-[10px] font-bold leading-tight transition-colors ${
                                    check.isValid ? 'text-foreground/90' : 'text-muted-foreground/70'
                                }`}>
                                    {check.label}
                                </p>
                                <p className="text-[9px] leading-normal text-muted-foreground/60 font-medium hidden group-hover/item:block group-focus/item:block transition-all duration-200">
                                    {check.tip}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
