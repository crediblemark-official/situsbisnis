"use client";

import React from "react";

export function ProblemSection() {
    return (
        <>
            {/* Part 1: Breathtaking Dark Neon Background for Header Only */}
            <section className="py-10 md:py-16 bg-gradient-to-b from-[#021526] to-[#010e1a] relative overflow-hidden border-t border-b border-[#03223b] text-white">
                {/* Elegant Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0369a1_0.5px,transparent_0.5px),linear-gradient(to_bottom,#0369a1_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />
                <div className="absolute inset-0 bg-dot-pattern opacity-15 pointer-events-none" />

                {/* Background glowing elements aligned with brand sky/indigo colors */}
                <div className="absolute top-[10%] left-[-15%] w-[45vw] h-[45vw] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
                <div className="absolute bottom-[10%] right-[-15%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">

                        {/* Left Column: High-Fidelity Premium UI Comparison Dashboard (Company Standard) */}
                        <div className="lg:col-span-6 xl:col-span-7 w-full relative order-2 lg:order-1">
                            {/* Glowing backdrop shadow for the dashboard using brand colors */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/15 via-transparent to-indigo-500/15 rounded-xl blur-3xl -z-10 pointer-events-none animate-pulse-slow" />

                            {/* Browser/Device Shell */}
                            <div className="relative rounded-xl border border-slate-800/80 bg-slate-950 overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.85)] flex flex-col w-full">
                                {/* Header / Browser Title Bar */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/90 relative shrink-0">
                                    <div className="flex gap-1.5 shrink-0 relative z-10">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800/70" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-800/70" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="bg-slate-950 text-[9.5px] text-slate-400 font-mono py-1 px-5 rounded-md border border-slate-850 flex items-center gap-1 w-[60%] justify-center max-w-sm pointer-events-auto select-none shadow-inner">
                                            sistem-bisnis-dilema.io
                                        </div>
                                    </div>
                                    <div className="w-10" />
                                </div>

                                {/* Browser Body Content */}
                                <div className="p-3.5 sm:p-5 relative flex flex-col sm:flex-row gap-3.5 items-stretch bg-slate-950/40">
                                    {/* Grid mesh backdrop */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e293b_0.5px,transparent_0.5px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none" />

                                    {/* Mid-line separator */}
                                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-gradient-to-b from-transparent via-slate-850 to-transparent hidden sm:block pointer-events-none" />

                                    {/* Left Panel: Marketplace Admin Traps */}
                                    <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 rounded-lg bg-gradient-to-b from-sky-950/10 to-sky-950/[0.03] border border-sky-500/10 relative overflow-hidden group/item">
                                        <div className="absolute -top-12 -left-12 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover/item:scale-150 transition-transform duration-700 pointer-events-none" />
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-sm text-sm">🛒</div>
                                                <div>
                                                    <div className="text-[8.5px] font-black text-sky-400 uppercase tracking-widest leading-none mb-0.5">Skenario Komisi</div>
                                                    <div className="text-[11.5px] font-black text-slate-200 tracking-tight">Potongan Marketplace</div>
                                                </div>
                                            </div>

                                            {/* Micro Report UI */}
                                            <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-md flex flex-col gap-2.5 shadow-inner backdrop-blur-sm mb-4">
                                                <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-wider">
                                                    <span>Omzet Kotor</span>
                                                    <span className="text-slate-350 font-bold">Rp 10.000.000</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] font-extrabold text-sky-400 border-b border-slate-800/60 pb-2">
                                                    <span>Beban Admin (12.5%)</span>
                                                    <span>-Rp 1.250.000</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black text-slate-100 pt-0.5">
                                                    <span>Dana Bersih</span>
                                                    <span className="bg-sky-950/50 px-2 py-0.5 rounded border border-sky-900/40 text-sky-400">Rp 8.750.000</span>
                                                </div>
                                            </div>

                                            {/* Danger badge */}
                                            <div className="px-3 py-1.5 rounded-md bg-sky-950/20 border border-sky-900/30 text-[9px] font-extrabold text-sky-400 text-center tracking-wide leading-normal">
                                                🚨 Profit bersih terus terpotong setiap transaksi
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Panel: Custom Web Vendor Traps */}
                                    <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 rounded-lg bg-gradient-to-b from-amber-950/10 to-amber-950/[0.03] border border-amber-500/10 relative overflow-hidden group/item">
                                        <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover/item:scale-150 transition-transform duration-700 pointer-events-none" />
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-sm text-sm">💻</div>
                                                <div>
                                                    <div className="text-[8.5px] font-black text-amber-400 uppercase tracking-widest leading-none mb-0.5">Custom Vendor Web</div>
                                                    <div className="text-[11.5px] font-black text-slate-200 tracking-tight">Tagihan Awal & Server</div>
                                                </div>
                                            </div>

                                            {/* Micro Invoice UI */}
                                            <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-md flex flex-col gap-1.5 shadow-inner backdrop-blur-sm mb-4">
                                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                                                    <span>Biaya Jasa Setup</span>
                                                    <span className="text-slate-350 font-bold">Rp 8.500.000</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold border-b border-slate-800/60 pb-2">
                                                    <span>Hosting & SSL / Thn</span>
                                                    <span className="text-slate-350 font-bold">Rp 1.800.000</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px] font-black text-slate-100 pt-0.5">
                                                    <span>Total Pengeluaran</span>
                                                    <span className="bg-amber-950/50 px-2 py-0.5 rounded border border-amber-900/40 text-amber-400">Rp 10.300.000</span>
                                                </div>
                                            </div>

                                            {/* Warning badge */}
                                            <div className="px-3 py-1.5 rounded-md bg-amber-950/20 border border-amber-900/30 text-[9px] font-extrabold text-amber-400 text-center tracking-wide leading-normal">
                                                🐢 Modal awal sangat tinggi + proses berbulan-bulan
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Right Column: Left-aligned Text Content */}
                        <div className="lg:col-span-6 xl:col-span-5 text-center lg:text-left flex flex-col items-center lg:items-start order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4.5 md:py-2.5 rounded-full bg-sky-500/10 text-sky-400 text-[9px] md:text-xs font-black uppercase tracking-[0.18em] mb-4 md:mb-6 border border-sky-500/20 shadow-lg shadow-sky-950/20">
                                Realita Saat Ini
                            </div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-black mb-4 md:mb-6 leading-[1.1] text-white tracking-tighter text-center lg:text-left">
                                Dilema Pebisnis <br /> <span className="text-sky-400">Masa Kini.</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base font-semibold leading-relaxed max-w-xl animate-fade-in text-center lg:text-left mx-auto lg:mx-0">
                                Banyak pebisnis online terjebak dalam dua pilihan sulit. Memilih marketplace yang memakan profit, atau membuat web konvensional yang menguras budget.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Part 2: Marketplace and Conventional Web Dilemmas in Elegant Light Mode */}
            <section className="py-10 md:py-16 bg-[#FAFAFA] relative overflow-hidden border-b border-slate-200/70">
                {/* Elegant Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
                <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

                {/* Background glowing elements */}
                <div className="absolute top-[15%] left-[-10%] w-[35vw] h-[35vw] bg-sky-200/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
                <div className="absolute bottom-[15%] right-[-10%] w-[30vw] h-[30vw] bg-amber-200/10 rounded-full blur-[90px] pointer-events-none animate-pulse-slow" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex lg:grid lg:grid-cols-2 overflow-x-auto no-scrollbar snap-x snap-mandatory gap-8 lg:gap-16 -mx-4 px-6 sm:-mx-6 sm:px-10 lg:mx-0 lg:px-0 pb-4" tabIndex={0} role="region" aria-label="Perbandingan dilema marketplace dan web konvensional">

                        {/* Column 1: Marketplace Dilemma */}
                        <div className="snap-start scroll-ml-6 lg:scroll-ml-0 min-w-[82vw] sm:min-w-[400px] lg:min-w-0 flex flex-col gap-5 md:gap-6 bg-white/60 p-5 sm:p-6 rounded-xl border border-slate-200/50 shadow-sm lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none">
                            {/* Header */}
                            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left gap-3 md:gap-4 mx-auto md:mx-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center text-xl md:text-2xl shadow-sm shrink-0 border border-sky-200/35">🛒</div>
                                <div>
                                    <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-1 tracking-tight">Jualan di Marketplace</h3>
                                    <p className="text-slate-550 text-xs md:text-sm font-semibold leading-relaxed">Omzet terlihat besar, tapi profit menipis dimakan biaya admin.</p>
                                </div>
                            </div>

                            {/* List of Dilemmas */}
                            <div className="flex flex-col gap-3.5 pl-1">
                                {/* Point 1 */}
                                <div className="flex gap-3.5 group items-center">
                                    <div className="w-5.5 h-5.5 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 font-black text-xs text-sky-500 group-hover:scale-110 transition-transform">!</div>
                                    <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors">Potongan Gila-gilaan</h4>
                                </div>

                                {/* Point 2 */}
                                <div className="flex gap-3.5 group items-center">
                                    <div className="w-5.5 h-5.5 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 font-black text-xs text-sky-500 group-hover:scale-110 transition-transform">!</div>
                                    <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors">Perang Harga Brutal</h4>
                                </div>

                                {/* Point 3 */}
                                <div className="flex gap-3.5 group items-center">
                                    <div className="w-5.5 h-5.5 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 font-black text-xs text-sky-500 group-hover:scale-110 transition-transform">!</div>
                                    <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight group-hover:text-sky-600 transition-colors">Arus Kas Tertahan</h4>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Conventional Web Dilemma */}
                        <div className="snap-start scroll-ml-6 lg:scroll-ml-0 min-w-[82vw] sm:min-w-[400px] lg:min-w-0 flex flex-col gap-5 md:gap-6 bg-white/60 p-5 sm:p-6 rounded-xl border border-slate-200/50 shadow-sm lg:bg-transparent lg:p-0 lg:border-0 lg:shadow-none">
                            {/* Header */}
                            <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left gap-3 md:gap-4 mx-auto md:mx-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl md:text-2xl shadow-sm shrink-0 border border-amber-200/35">💻</div>
                                <div>
                                    <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-1 tracking-tight">Bikin Web Konvensional</h3>
                                    <p className="text-slate-550 text-xs md:text-sm font-semibold leading-relaxed">Investasi sangat mahal di awal, pusing memikirkan hal teknis rumit di belakang.</p>
                                </div>
                            </div>

                            {/* List of Dilemmas */}
                            <div className="flex flex-col gap-3.5 pl-1">
                                {/* Point 1 */}
                                <div className="flex gap-3.5 group items-center">
                                    <div className="w-5.5 h-5.5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 font-black text-xs text-amber-600 group-hover:scale-110 transition-transform">!</div>
                                    <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">Biaya Vendor Jutaan Rupiah</h4>
                                </div>

                                {/* Point 2 */}
                                <div className="flex gap-3.5 group items-center">
                                    <div className="w-5.5 h-5.5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 font-black text-xs text-amber-600 group-hover:scale-110 transition-transform">!</div>
                                    <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">Server & SSL Perawatan Tahunan</h4>
                                </div>

                                {/* Point 3 */}
                                <div className="flex gap-3.5 group items-center">
                                    <div className="w-5.5 h-5.5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 font-black text-xs text-amber-600 group-hover:scale-110 transition-transform">!</div>
                                    <h4 className="text-xs sm:text-sm md:text-base font-black text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">Proses Pengerjaan Lambat</h4>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}
