"use client";

import React from "react";
import { Sparkles, ShieldCheck, Clock, ArrowRight, Gift } from "lucide-react";
import Link from "next/link";

interface PricingSectionProps {
    plans?: any[];
    currency?: string;
}

export function PricingSection({ plans: _plans = [], currency: _currency = "IDR" }: PricingSectionProps) {
    return (
        <section id="pricing" className="py-7 md:py-16 bg-slate-50/50 relative overflow-hidden border-t border-slate-200/60">
            {/* Elegant Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

            {/* Background Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-sky-400/5 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section - Super Compact */}
                <div className="text-center mb-5 md:mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 md:px-3.5 md:py-1.5 rounded-lg bg-sky-500/10 text-sky-600 text-[9px] md:text-xs font-black uppercase tracking-[0.18em] mb-3 md:mb-4 border border-sky-200/50">
                        <Sparkles size={12} className="text-sky-500" /> Uji Coba Tanpa Risiko
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">
                        Mulai Gratis. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500">Nikmati Fitur PRO.</span>
                    </h2>
                </div>

                {/* 3-Column Simple Promo Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
                    
                    {/* Card 1: 14 Days PRO Trial */}
                    <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.02)] flex items-center gap-3.5 sm:gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300/80 group">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 text-sky-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <Gift size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">PRO Gratis 14 Hari</h3>
                            <p className="text-xs text-slate-555 font-semibold mt-0.5 leading-relaxed">
                                Coba semua fitur premium gratis tanpa kartu kredit.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Trial Extension */}
                    <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.02)] flex items-center gap-3.5 sm:gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300/80 group">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 text-sky-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Bisa Req Trial 7 Hari</h3>
                            <p className="text-xs text-slate-555 font-semibold mt-0.5 leading-relaxed">
                                Perpanjang masa uji coba via dashboard admin.
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Grace Period & Free Downgrade */}
                    <div className="p-4 sm:p-6 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-[0_15px_30px_-15px_rgba(0,0,0,0.02)] flex items-center gap-3.5 sm:gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300/80 group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 tracking-tight">Masa Grace 30 Hari</h3>
                            <p className="text-xs text-slate-555 font-semibold mt-0.5 leading-relaxed">
                                Data aman & otomatis turun ke paket Free.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Call To Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                    <Link 
                        href="/register" 
                        className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest text-center shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform duration-300"
                    >
                        Mulai Uji Coba PRO
                    </Link>
                    <Link 
                        href="/pricing" 
                        className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg font-black text-[10px] uppercase tracking-widest text-center shadow-sm hover:scale-105 transition-transform duration-300 flex items-center justify-center gap-2"
                    >
                        Detail Harga <ArrowRight size={12} className="text-slate-400" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
