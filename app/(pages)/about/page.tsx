import React from "react";
import { LazyLink as Link } from "@/components/ui/LazyLink";
import Image from "next/image";
import {
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Rocket,
    Users,
    ShieldCheck
} from "lucide-react";

import { Metadata } from "next";
import { getTenant } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";

import { getPlatformSettings } from "@/lib/settings/platform";

export const revalidate = 3600; // Cache page statically for 1 hour (ISR)

export async function generateMetadata(): Promise<Metadata> {
    const platform = await getPlatformSettings();
    return {
        title: `Tentang ${platform.siteName} - Solusi Website Multi-Tenant Premium`,
        description: `Kenali visi dan misi ${platform.siteName} dalam mendigitalisasi bisnis Indonesia dengan platform website builder tercanggih.`
    };
}

export default async function AboutPage() {
    const platform = await getPlatformSettings();
    const subdomain = await getTenant();
    if (subdomain) {
        notFound();
    }

    return (
        <div className="bg-[#FAFAFA] text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
            {/* Hero Section - Split Layout */}
            <section className="relative pt-32 pb-20 overflow-hidden border-b border-slate-100 bg-white">
                {/* Background Accents */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-[0.03]">
                    <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[160px] animate-pulse" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-600 text-[10px] font-bold uppercase tracking-widest mb-8">
                            <Sparkles size={12} />
                            Misi & Visi Kami
                        </div>

                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                            Bawa Bisnis Anda <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600">Ke Dunia Digital.</span>
                        </h1>

                        <p className="max-w-xl text-lg md:text-xl text-slate-500 mb-10 leading-relaxed font-medium">
                            {platform.siteName} dibuat khusus untuk membantu UMKM Indonesia. Kami menghilangkan semua keribetan teknis supaya Anda bisa punya website profesional sekelas perusahaan besar, tanpa pusing.
                        </p>

                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[11, 12, 13, 14].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 overflow-hidden relative shadow-sm">
                                        <Image src={`https://i.pravatar.cc/100?img=${i}`} alt="user" fill sizes="40px" className="object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="h-10 w-px bg-slate-200" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-tight">
                                <span className="text-sky-500 block text-sm">1,200+</span> Bisnis Bergabung
                            </p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 bg-white p-2">
                            <div className="rounded-[2.5rem] overflow-hidden">
                                <Image
                                    src="/images/about-hero.png"
                                    alt="Digital Transformation"
                                    width={1024}
                                    height={1024}
                                    priority
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-sky-500/20 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </section>

            {/* Core Values Section - Premium Horizontal Cards */}
            <section className="py-24 bg-[#FAFAFA]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            {
                                icon: <Rocket size={24} />,
                                title: "Website Super Cepat",
                                color: "text-sky-600",
                                bg: "bg-sky-50",
                                desc: "Gak ada lagi cerita website lemot. Kami pastikan website Anda langsung terbuka dalam hitungan detik."
                            },
                            {
                                icon: <ShieldCheck size={24} />,
                                title: "Aman dan Terpercaya",
                                color: "text-sky-600",
                                bg: "bg-sky-50",
                                desc: "Data Anda dan pelanggan dijamin aman dari serangan peretas. Serahkan urusan keamanan pada ahlinya."
                            },
                            {
                                icon: <Users size={24} />,
                                title: "Cocok Buat UMKM",
                                color: "text-sky-600",
                                bg: "bg-sky-50",
                                desc: "Semua fitur yang ada dibuat khusus karena kami mengerti kebutuhan jualan pedagang lokal."
                            }
                        ].map((item, i) => (
                            <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-sky-500/20 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-500">
                                <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-black mb-3 tracking-tight text-slate-800">{item.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Narrative Section - PAS Alignment */}
            <section className="py-32 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-sky-500 to-sky-700 rounded-[3rem] p-8 md:p-16 overflow-hidden relative shadow-2xl border border-white/20">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                    Kenapa Harus <br />
                                    <span className="text-[#FFD700] drop-shadow-md">{platform.siteName}?</span>
                                </h2>
                                <div className="space-y-6 text-white/90 leading-relaxed font-medium">
                                    <p>
                                        Berawal dari satu pertanyaan: Kenapa UMKM harus keluar uang jutaan dan nunggu lama banget cuma buat bikin website?
                                    </p>
                                    <p>
                                        Banyak jualan bagus tapi sepi pembeli karena gak punya &quot;toko online&quot; sendiri. {platform.siteName} hadir supaya Anda punya kendali penuh atas toko Anda, tanpa harus numpang di platform orang lain terus.
                                    </p>
                                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            "Server Super Ngebut",
                                            "Edit Tampilan Tinggal Geser",
                                            "Gampang Masuk Google",
                                            "Tampil Bagus di HP"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <CheckCircle2 size={18} className="text-[#FFD700]" />
                                                <span className="text-xs font-bold text-white uppercase tracking-widest">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/20 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                                    <Image
                                        src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2070"
                                        alt="Collaboration"
                                        width={2070}
                                        height={1380}
                                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                    />
                                </div>
                                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
                                    <p className="text-sky-500 font-black text-2xl tracking-tighter">1,200+</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bisnis Bergabung</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 bg-white">
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[10px] font-bold uppercase tracking-widest mb-8">
                        Mulai Perjalanan Anda
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-[1.1] text-slate-800">
                        Bikin Usaha Anda Lebih <br />
                        <span className="text-sky-500">Keren Hari Ini Juga.</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-slate-500 mb-12 font-medium">
                        Gak usah nunggu besok. Sistem kami sudah siap bantu bisnis Anda naik level sekarang juga.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/register" className="group px-8 py-5 bg-sky-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-sky-500/30 hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
                            Mulai Sekarang - Gratis! <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/" className="px-8 py-5 bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
                            Lihat Demo
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
