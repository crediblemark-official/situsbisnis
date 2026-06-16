"use client";

import React from "react";
import { 
    Layers, 
    FileText, 
    BookOpen, 
    MessageSquare, 
    Briefcase, 
    Image as ImageIcon, 
    ShoppingBag, 
    Mail, 
    Palette, 
    Globe, 
    MessageCircle, 
    Search, 
    Users
} from "lucide-react";

interface FeatureItem {
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

export function FeaturesGrid() {
    const features: FeatureItem[] = [
        {
            label: "Visual Builder Drag n Drop",
            description: "Bikin halaman website instan secara visual tanpa perlu ribet coding sama sekali.",
            icon: <Layers className="w-5 h-5 text-sky-400" />,
            color: "bg-sky-500/10 border-sky-500/20"
        },
        {
            label: "Pages (Halaman Bebas)",
            description: "Buat halaman landing page, kontak, portofolio, atau informasi tambahan tanpa batasan.",
            icon: <FileText className="w-5 h-5 text-blue-400" />,
            color: "bg-blue-500/10 border-blue-500/20"
        },
        {
            label: "Blog & Artikel",
            description: "Bagikan artikel dan panduan bisnis edukatif demi mendongkrak traffic pengunjung secara berkala.",
            icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
            color: "bg-emerald-500/10 border-emerald-500/20"
        },
        {
            label: "Testimonial Pelanggan",
            description: "Tampilkan review positif dan kepuasan pembeli otomatis untuk melipatgandakan kepercayaan.",
            icon: <MessageSquare className="w-5 h-5 text-teal-400" />,
            color: "bg-teal-500/10 border-teal-500/20"
        },
        {
            label: "Portofolio Modern",
            description: "Pajang galeri proyek sukses dan hasil karya terbaik bisnis Anda secara rapi dan profesional.",
            icon: <Briefcase className="w-5 h-5 text-indigo-400" />,
            color: "bg-indigo-500/10 border-indigo-500/20"
        },
        {
            label: "Galeri Foto HD",
            description: "Katalog foto produk terintegrasi dengan lightbox interaktif yang sangat ringan dibuka.",
            icon: <ImageIcon className="w-5 h-5 text-purple-400" />,
            color: "bg-purple-500/10 border-purple-500/20"
        },
        {
            label: "Toko Online & E-Commerce",
            description: "Kelola produk, pantau stok, serta terima pesanan belanja pembeli siap saji secara otomatis.",
            icon: <ShoppingBag className="w-5 h-5 text-rose-400" />,
            color: "bg-rose-500/10 border-rose-500/20"
        },
        {
            label: "Inbox & Manajemen Kontak",
            description: "Semua pesan masuk dari formulir kontak terpusat langsung di dalam admin panel Anda.",
            icon: <Mail className="w-5 h-5 text-pink-400" />,
            color: "bg-pink-500/10 border-pink-500/20"
        },
        {
            label: "Custom Branding Website",
            description: "Kustomisasi logo, pilihan warna brand, font, serta identitas eksklusif situs Anda.",
            icon: <Palette className="w-5 h-5 text-amber-400" />,
            color: "bg-amber-500/10 border-amber-500/20"
        },
        {
            label: "Custom Domain Profesional",
            description: "Hubungkan nama domain profesional pribadi (.com, .id, dll.) secara mandiri hanya dalam hitungan detik.",
            icon: <Globe className="w-5 h-5 text-violet-400" />,
            color: "bg-violet-500/10 border-violet-500/20"
        },
        {
            label: "Floating Chat Widget",
            description: "Pasang tombol WhatsApp/Chat melayang agar pembeli terhubung dengan respon tercepat Anda.",
            icon: <MessageCircle className="w-5 h-5 text-green-400" />,
            color: "bg-green-500/10 border-green-500/20"
        },
        {
            label: "SEO Teroptimasi",
            description: "Dirakit dengan standar kecepatan tinggi dan meta tag otomatis agar web Anda mudah masuk Google.",
            icon: <Search className="w-5 h-5 text-cyan-400" />,
            color: "bg-cyan-500/10 border-cyan-500/20"
        },
        {
            label: "Multirole User",
            description: "Kelola akun staf atau administrator tambahan dengan tingkat hak akses yang aman dan terkontrol.",
            icon: <Users className="w-5 h-5 text-slate-400" />,
            color: "bg-slate-500/10 border-slate-500/20"
        }
    ];
    const duplicatedFeatures = [...features, ...features];

    return (
        <section id="features" className="py-8 md:py-16 bg-[#01080e] relative overflow-hidden border-t border-b border-slate-900 text-white select-none">
            {/* High-Tech Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1d2e_0.5px,transparent_0.5px),linear-gradient(to_bottom,#0c1d2e_0.5px,transparent_0.5px)] bg-[size:5rem_5rem] opacity-20 pointer-events-none" />
            
            {/* Soft Ambient Mesh Shadows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[20vh] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-6 md:mb-8">
                {/* Header - Sleek & Compact */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 md:px-3.5 md:py-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-[9px] md:text-xs font-black uppercase tracking-[0.18em] mb-3 md:mb-4 border border-sky-500/20 shadow-lg shadow-sky-955/20">
                        Fitur Lengkap
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-[1.1]">
                        Satu Ekosistem. <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400">Segudang Kemudahan.</span>
                    </h2>
                </div>
            </div>

            {/* Infinite Marquee Track Container with Smooth Fade Edges */}
            <div className="relative w-full overflow-hidden py-3">
                {/* Fade Left Overlay */}
                <div className="absolute top-0 left-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-[#01080e] via-[#01080e]/70 to-transparent z-10 pointer-events-none" />
                {/* Fade Right Overlay */}
                <div className="absolute top-0 right-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-[#01080e] via-[#01080e]/70 to-transparent z-10 pointer-events-none" />

                {/* The Scrolling Row */}
                <div className="animate-marquee gap-4 flex items-center">
                    {duplicatedFeatures.map((f, i) => (
                        <div 
                            key={i}
                            className="bg-[#020e1a]/40 backdrop-blur-md border border-slate-800/80 hover:border-sky-500/30 transition-all duration-300 rounded-xl px-5 py-3 flex items-center gap-3 shrink-0 shadow-lg shadow-black/10 group cursor-pointer"
                        >
                            {/* Icon Box */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${f.color} shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                {f.icon}
                            </div>
                            
                            {/* Label */}
                            <span className="text-sm font-bold text-white tracking-tight shrink-0">
                                {f.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
