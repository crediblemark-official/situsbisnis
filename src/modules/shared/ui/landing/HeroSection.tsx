"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp, CheckCircle, Smartphone } from "lucide-react";

export function HeroSection() {
    return (
        <section className="relative pt-8 pb-4 md:pt-20 md:pb-14 overflow-hidden bg-white">
            {/* Ambient Background Grid Pattern with Radial Masks */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />
            <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

            {/* Premium Ambient Background Glow Meshes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute -top-[15%] -left-[10%] w-[50vw] h-[50vw] bg-gradient-to-tr from-sky-400/25 to-indigo-500/15 rounded-full blur-[140px] animate-pulse-slow" />
                <div className="absolute top-[25%] -right-[15%] w-[45vw] h-[45vw] bg-gradient-to-br from-blue-400/20 to-purple-500/15 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-16 items-center">
                    
                    {/* Left Column: Premium Headline Pitch */}
                    <div className="lg:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start animate-in fade-in slide-in-from-left-6 duration-1000">
                        {/* Glowing Premium Capsule Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-[0_8px_20px_rgba(0,0,0,0.02)] text-slate-800 text-[9px] md:text-xs font-black uppercase tracking-[0.18em] mb-3 md:mb-5 hover:border-slate-350 transition-colors">
                            <Sparkles size={12} className="text-amber-500 animate-pulse" />
                            Solusi Website Instan No. 1 di Indonesia
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black tracking-tighter mb-3 leading-[1.08] md:leading-[0.98] text-slate-900 text-center lg:text-left">
                             Bikin Website Bisnis <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-sky-600">Praktis & Instan.</span>
                        </h1>

                        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-500 font-semibold mb-3 md:mb-5 leading-relaxed max-w-xl text-center lg:text-left mx-auto lg:mx-0">
                            Tidak butuh coding, tidak butuh keahlian IT. Platform website instan tercanggih untuk UMKM Indonesia. Cukup isi data, unggah produk, dan website Anda langsung online saat ini juga!
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-3 md:mb-6">
                            <Link href="/register" className="w-full sm:w-auto group px-5 py-3 md:px-6 md:py-4 bg-primary text-white rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-[1.02] hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2.5 focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none ring-offset-2 ring-offset-background">
                                Mulai Gratis <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                            <a href="#features" className="w-full sm:w-auto px-5 py-3 md:px-6 md:py-4 bg-white text-slate-700 border border-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.02)] rounded-lg font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-350 hover:-translate-y-0.5 transition-all active:scale-95 flex justify-center items-center focus-visible:ring-4 focus-visible:ring-slate-300/40 focus-visible:outline-none ring-offset-2 ring-offset-background">
                                Lihat Fitur
                            </a>
                        </div>

                        {/* Social Proof */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 md:gap-4 opacity-95 w-full sm:w-auto justify-center lg:justify-start text-center lg:text-left">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-[26px] h-[26px] sm:w-[30px] sm:h-[30px] rounded-full border-[1.5px] sm:border-2 border-white bg-slate-250 flex items-center justify-center overflow-hidden relative shadow-sm hover:scale-110 hover:z-20 transition-all duration-300">
                                        <Image
                                            src={`https://i.pravatar.cc/100?img=${i + 10}`}
                                            alt="user"
                                            fill
                                            sizes="30px"
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-slate-450 leading-none mb-1">Dipercaya 1,200+ Bisnis</p>
                                <p className="text-[8px] md:text-[9px] text-slate-400 font-bold leading-none">Rating kepuasan UMKM 4.9/5 ★</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Browser Shell Mockup */}
                    <div className="lg:col-span-7 w-full relative animate-in fade-in slide-in-from-right-6 duration-1000 delay-200 mt-4 lg:mt-0">
                        
                        {/* Floating Card 1: Sales statistics (Top Left) */}
                        <div className="absolute -left-6 -top-6 hidden sm:flex flex-col gap-1.5 p-4 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] z-20 w-48 text-left animate-float hover:scale-105 hover:-translate-y-0.5 hover:border-slate-350 transition-all duration-350">
                            <div className="flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Total Penjualan</span>
                                <div className="w-5.5 h-5.5 rounded bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
                                    <TrendingUp size={11} />
                                </div>
                            </div>
                            <div className="text-base font-black text-slate-900 tracking-tight">Rp 4,520,000</div>
                            <div className="text-[8px] text-emerald-700 font-bold flex items-center gap-1">
                                <span className="px-1 py-0.5 rounded bg-emerald-50 border border-emerald-100">+24.5%</span> 
                                <span className="text-slate-400 font-medium">minggu ini</span>
                            </div>
                        </div>

                        {/* Floating Card 2: Domain Status (Middle Right) */}
                        <div className="absolute -right-4 top-1/3 hidden sm:flex items-center gap-3 p-4 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] z-20 w-52 text-left animate-float-reverse hover:scale-105 hover:-translate-y-0.5 hover:border-slate-350 transition-all duration-350">
                            <div className="w-8.5 h-8.5 rounded bg-sky-50 border border-sky-100 text-sky-650 flex items-center justify-center shrink-0 shadow-sm">
                                <CheckCircle size={16} />
                            </div>
                            <div>
                                <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Status Domain</div>
                                <div className="text-[11px] font-black text-slate-900 leading-tight">tokokita.id</div>
                                <div className="text-[8px] text-sky-650 font-bold flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                                    <span>SSL Terproteksi</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card 3: Mobile Edit Preview (Bottom Left) */}
                        <div className="absolute -left-8 bottom-6 hidden sm:flex items-center gap-3 p-4 bg-white/95 backdrop-blur-md rounded-lg border border-slate-200/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] z-20 w-56 text-left animate-float hover:scale-105 hover:-translate-y-0.5 hover:border-slate-350 transition-all duration-350">
                            <div className="w-8.5 h-8.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-650 flex items-center justify-center shrink-0 shadow-sm">
                                <Smartphone size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">Order Baru Masuk</div>
                                <div className="text-[11px] font-black text-slate-900 leading-tight truncate">Hijab Voal Premium</div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <span className="text-[9px] font-black text-slate-650">Rp 120,000</span>
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold text-[7.5px] tracking-wider uppercase">WA Sent</span>
                                </div>
                            </div>
                        </div>

                        {/* Glowing shadow backdrop behind chrome layout */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/10 via-transparent to-indigo-500/10 rounded-xl blur-3xl -z-10 pointer-events-none animate-pulse-slow" />

                        {/* Beautiful Metal & Glass Browser Chrome Shell */}
                        <div className="relative rounded-xl border border-slate-200/85 bg-white/50 p-1.5 backdrop-blur-md overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)]">
                            <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/5 via-transparent to-indigo-500/5 pointer-events-none" />
                            <div className="rounded-lg border border-slate-200/80 overflow-hidden bg-slate-950 shadow-2xl flex flex-col">
                                {/* Browser-style Header */}
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800/90 relative">
                                    <div className="flex gap-1.5 shrink-0 relative z-10">
                                        <div className="w-2 h-2 rounded-full bg-rose-500/80 shadow-sm shadow-rose-500/20" />
                                        <div className="w-2 h-2 rounded-full bg-amber-500/80 shadow-sm shadow-amber-500/20" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/20" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-slate-950/95 text-[9px] text-slate-400 font-mono py-0.5 px-4 rounded border border-slate-800/70 flex items-center gap-1 w-[60%] justify-center max-w-sm pointer-events-auto select-none shadow-inner">
                                            <span className="opacity-45 text-sky-400 font-extrabold font-sans">https://</span>app.situsbisnis.id
                                        </div>
                                    </div>
                                </div>
                                {/* Website Preview Container */}
                                <div className="relative bg-[#FAFAFA] aspect-[1024/512]">
                                    <Image
                                        src="/images/hero-mockup.png"
                                        alt="Platform Preview"
                                        fill
                                        className="object-cover opacity-100"
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 1024px"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative element blurs */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                    </div>

                </div>
            </div>
        </section>
    );
}
