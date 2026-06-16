import React from "react";
import { Metadata } from "next";
import { getTenant } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";
import { Mail, MapPin, ArrowRight, MessageSquare, Sparkles } from "lucide-react";

import { getPlatformSettings } from "@/lib/settings/platform";

export const revalidate = 3600; // Cache page statically for 1 hour (ISR)

export async function generateMetadata(): Promise<Metadata> {
    const platform = await getPlatformSettings();
    return {
        title: `Hubungi Kami - ${platform.siteName}`,
        description: `Hubungi tim ${platform.siteName} untuk bantuan teknis, pertanyaan layanan, atau kerjasama bisnis.`
    };
}

export default async function ContactPage() {
    const subdomain = await getTenant();
    if (subdomain) {
        notFound();
    }

    const platform = await getPlatformSettings();
    const contactEmail = platform.contactEmail || "support@SitusBisnis.id";
    const contactPhone = platform.contactPhone || "+62 812-3456-7890";
    const whatsappNumber = platform.whatsappNumber || "6281234567890";
    const officeAddress = platform.footerAddress || "Jakarta, Indonesia";

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-primary/20 selection:text-primary font-sans relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <main className="relative z-10 pt-12 pb-16 md:pt-24 md:pb-24 max-w-5xl mx-auto px-5">
                <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                        <Sparkles size={14} /> Terhubung Sekarang
                    </div>
                    <h1 className="text-3xl md:text-6xl font-black tracking-tighter mb-6 leading-[0.95] md:leading-[0.9]">
                        Mari Bangun <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-indigo-600">Masa Depan Digital</span>
                    </h1>
                    <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed px-4 md:px-0">
                        Punya visi besar atau butuh bantuan teknis? Tim ahli kami siap mendukung pertumbuhan bisnis Anda dengan solusi digital tercanggih.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                    {/* Contact Card: Email */}
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-4 md:p-5 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-black/[0.02] flex items-center gap-4 md:gap-6 hover:-translate-y-1 transition-transform duration-500">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <Mail size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Email Official</h3>
                                <p className="text-base md:text-lg font-black text-slate-900 truncate">{contactEmail}</p>
                            </div>
                            <div className="shrink-0">
                                <a href={`mailto:${contactEmail}`} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all group/link">
                                    <ArrowRight size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Card: WhatsApp */}
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-4 md:p-5 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-black/[0.02] flex items-center gap-4 md:gap-6 hover:-translate-y-1 transition-transform duration-500">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <MessageSquare size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">WhatsApp Bisnis</h3>
                                <p className="text-base md:text-lg font-black text-slate-900 truncate">{contactPhone}</p>
                            </div>
                            <div className="shrink-0">
                                <a href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 hover:bg-emerald-700 hover:text-white transition-all group/link">
                                    <ArrowRight size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Card: Office */}
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-400 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-4 md:p-5 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl shadow-black/[0.02] flex items-center gap-4 md:gap-6 hover:-translate-y-1 transition-transform duration-500">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 shrink-0 group-hover:scale-110 transition-transform duration-500">
                                <MapPin size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Markas Utama</h3>
                                <p className="text-base md:text-lg font-black text-slate-900 leading-tight">{officeAddress}</p>
                            </div>
                            <div className="shrink-0 text-[10px] font-bold text-indigo-500 opacity-60">
                                24/7 Remote
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Section: Support Info */}
                <div className="mt-16 md:mt-20 p-6 md:p-10 bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="max-w-lg">
                            <h2 className="text-2xl font-black text-white mb-4">Bantuan Teknis & FAQ</h2>
                            <p className="text-slate-400 leading-relaxed">
                                Butuh jawaban cepat? Dokumentasi lengkap kami mencakup semua panduan mulai dari pengaturan domain hingga optimasi SEO toko Anda.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button className="px-6 py-3.5 bg-white text-slate-900 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                                Pusat Bantuan
                            </button>
                            <button className="px-6 py-3.5 bg-white/10 text-white border border-white/20 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
                                Baca Dokumentasi
                            </button>
                        </div>
                    </div>
                </div>
            </main>


        </div>
    );
}

