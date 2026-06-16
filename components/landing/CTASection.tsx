"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTASectionProps {
    siteName: string;
}

export function CTASection({ siteName }: CTASectionProps) {
    return (
        <section className="py-8 md:py-16 px-4 relative overflow-hidden bg-white border-t border-slate-200/60">
            {/* Elegant Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="max-w-4xl mx-auto rounded-xl md:rounded-2xl bg-slate-950 text-white relative overflow-hidden shadow-2xl border border-slate-900">
                {/* Glowing Ambient Mesh Shadows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 pointer-events-none" />

                <div className="relative z-10 p-6 py-8 md:p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sky-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6">
                        <Sparkles size={11} className="animate-pulse" /> Mulai Instan
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter mb-4 leading-tight">
                        Sudah Siap Membawa <br /> Bisnis Anda Online?
                    </h2>
                    
                    <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed font-semibold max-w-lg">
                        Jangan biarkan kompetitor mendahului Anda. Bergabunglah sekarang dan bangun website bisnis profesional Anda bersama <span className="text-white font-bold">{siteName}</span>.
                    </p>

                    <Link 
                        href="/register" 
                        className="group inline-flex px-8 py-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all duration-300 shadow-lg shadow-sky-500/20 items-center gap-2 focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:outline-none"
                    >
                        Mulai Gratis Sekarang <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
