"use client";

import React from "react";
import Link from "next/link";
import {
    Layout, Sparkles, Globe, Package, Truck,
    Bot, Briefcase, Mail, BarChart, ArrowRight, Menu
} from "lucide-react";

export const MegaMenuContent = () => (
    <div className="absolute top-full left-0 right-0 pt-4 opacity-0 translate-y-4 pointer-events-none group-hover/mega:opacity-100 group-hover/mega:translate-y-0 group-hover/mega:pointer-events-auto transition-all duration-300 z-50 text-left">
        <div className="mx-auto w-[95vw] max-w-[1100px] bg-white rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden flex flex-col lg:flex-row">

            {/* Left: Dashboard Features */}
            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">

                {/* Column 1: Dagang */}
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Manajemen Dagang</h3>
                    <div className="space-y-4">
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Package size={18} className="text-slate-400 group-hover/item:text-primary" /> Produk & Stok
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Truck size={18} className="text-slate-400 group-hover/item:text-primary" /> Pesanan & Billing
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <BarChart size={18} className="text-slate-400 group-hover/item:text-primary" /> Laporan Penjualan
                        </Link>
                    </div>
                </div>

                {/* Column 2: Konten */}
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Manajemen Konten</h3>
                    <div className="space-y-4">
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Layout size={18} className="text-slate-400 group-hover/item:text-primary" /> Halaman Statis
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Briefcase size={18} className="text-slate-400 group-hover/item:text-primary" /> Portofolio & Galeri
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Bot size={18} className="text-slate-400 group-hover/item:text-primary" /> Artikel & Blog
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Sparkles size={18} className="text-slate-400 group-hover/item:text-primary" /> Testimoni Pelanggan
                        </Link>
                    </div>
                </div>

                {/* Column 3: Sistem */}
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sistem & Media</h3>
                    <div className="space-y-4">
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Globe size={18} className="text-slate-400 group-hover/item:text-primary" /> Media & Aset
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Menu size={18} className="text-slate-400 group-hover/item:text-primary" /> Navigasi Menu
                        </Link>
                        <Link href="#features" className="group/item flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-primary transition-colors">
                            <Mail size={18} className="text-slate-400 group-hover/item:text-primary" /> Pesan Masuk
                        </Link>
                    </div>
                </div>
            </div>

            {/* Right: Innovation Sidebar */}
            <div className="w-full lg:w-[280px] bg-slate-50 p-8 flex flex-col justify-center border-l border-slate-100">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Inovasi Tiada Henti</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-8">
                        Fitur-fitur baru akan terus ditambahkan setiap minggu untuk memastikan bisnis Anda tetap relevan.
                    </p>
                </div>

                <Link href="/roadmap" className="group/link flex items-center gap-2 text-primary font-bold text-sm">
                    Lihat Roadmap & Fitur
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    </div>
);
