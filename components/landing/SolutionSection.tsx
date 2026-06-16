"use client";

import React from "react";
import { Zap, Layout, Globe } from "lucide-react";

interface SolutionSectionProps {
    siteName: string;
}

export function SolutionSection({ siteName }: SolutionSectionProps) {
    return (
        <section className="py-10 md:py-16 bg-white relative overflow-hidden">
            {/* Elegant Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />
            
            {/* Decorative Soft Glowing Circles */}
            <div className="absolute top-[10%] left-[5%] w-[35vw] h-[35vw] bg-gradient-to-tr from-sky-300/15 to-indigo-400/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-[10%] right-[5%] w-[30vw] h-[30vw] bg-gradient-to-br from-emerald-300/15 to-teal-400/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-750 text-[9px] md:text-xs font-black uppercase tracking-[0.18em] mb-3 border border-sky-100 shadow-sm">
                        Pilihan Cerdas UMKM
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-4 md:mb-6">
                        Pindah ke {siteName}. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-500 to-indigo-650 md:inline">Anda yang Pegang Kendali.</span>
                    </h2>
                </div>

                <div 
                    tabIndex={0}
                    aria-label="Solusi website bisnis"
                    className="flex md:grid md:grid-cols-3 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-6 md:gap-8 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl pb-4"
                >
                    {/* Solusi 1: Fitur Lengkap */}
                    <div className="snap-start min-w-[88vw] md:min-w-0 group p-6 md:p-8 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-300 flex flex-col overflow-hidden relative">
                        <div className="relative z-10 flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Globe size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-3 text-slate-900 tracking-tight transition-colors">Fitur Lengkap, Jualan Mantap</h3>
                            <p className="text-slate-550 leading-relaxed text-[12.5px] font-medium">
                                Katalog produk profesional, integrasi WhatsApp, dan sistem konfirmasi otomatis. Semua kebutuhan jualan online tersedia tanpa komisi sepeser pun.
                            </p>
                        </div>
                    </div>

                    {/* Solusi 2: 5 Menit Jadi */}
                    <div className="snap-start min-w-[88vw] md:min-w-0 group p-6 md:p-8 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-300 flex flex-col overflow-hidden relative">
                        <div className="relative z-10 flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center mb-5 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-3 text-slate-900 tracking-tight transition-colors">Gaptek? Desain Instan & Praktis</h3>
                            <p className="text-slate-550 leading-relaxed text-[12.5px] font-medium">
                                Bikin website tanpa ribet coding. Cukup pilih layout favorit, isi deskripsi usaha Anda, dan customize langsung lewat editor visual yang intuitif.
                            </p>
                        </div>
                    </div>

                    {/* Solusi 3: Google & SEO */}
                    <div className="snap-start min-w-[88vw] md:min-w-0 group p-6 md:p-8 rounded-xl bg-slate-50/50 hover:bg-slate-50/80 transition-all duration-300 flex flex-col overflow-hidden relative">
                        <div className="relative z-10 flex flex-col">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-650 text-white flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Layout size={24} />
                            </div>
                            <h3 className="text-lg font-bold mb-3 text-slate-900 tracking-tight transition-colors">Otomatis Masuk Google & Ramah SEO</h3>
                            <p className="text-slate-550 leading-relaxed text-[12.5px] font-medium">
                                Website Anda otomatis dioptimalkan agar ramah mesin pencari, cepat terindeks oleh Google, dan mendatangkan pelanggan secara organik.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
