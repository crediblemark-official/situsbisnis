import React from "react";
import { getTenant } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";
import { Sparkles, Zap, ShieldCheck, Clock, RotateCcw, Database, ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/core/db";
import PricingContent from "./PricingContent";

import { getPlatformSettings } from "@/lib/settings/platform";
import { Metadata } from "next";

export const revalidate = 3600; // Cache page statically for 1 hour (ISR)

export async function generateMetadata(): Promise<Metadata> {
    const platform = await getPlatformSettings();
    return {
        title: `Harga Layanan - ${platform.siteName}`,
        description: `Pilih paket yang sesuai untuk pertumbuhan bisnis digital Anda di ${platform.siteName}. Transparan, terjangkau, dan tanpa biaya tersembunyi.`
    };
}

export default async function PricingPage() {
    const subdomain = await getTenant();
    if (subdomain) {
        notFound();
    }

    const platform = await getPlatformSettings();
    const dbPlans = await db.plan.findMany({
        where: { showInPricing: true } as any,
        orderBy: { price: 'asc' },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            priceYearly: true,
            originalPrice: true,
            originalPriceYearly: true,
            interval: true,
            trialDays: true,
            maxSites: true,
            maxProducts: true,
            maxPosts: true,
            maxAssets: true,
            maxOrders: true,
            maxTestimonials: true,
            features: true,
            addonSiteBilling: true
        }
    });

    const mainDomain = process.env.NEXT_PUBLIC_APP_URL || "SitusBisnis.com";
    const cleanDomain = mainDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const currency = (platform as any)?.currency || "IDR";

    const formatPrice = (price: any) => {
        return new Intl.NumberFormat('id-ID').format(Number(price));
    };

    const plans = dbPlans.map((plan: any) => {
        const coreFeatures: string[] = [];
        const limits: { label: string; value: string }[] = [];
        const planFeatures = plan.features as any || {};

        // 1. Core Sites Limit (Primary Limit)
        if (plan.maxSites === 1) limits.push({ label: "Jumlah Website", value: "1 Website" });
        else if (plan.maxSites === -1) limits.push({ label: "Jumlah Website", value: "Sepuasnya" });
        else limits.push({ label: "Jumlah Website", value: `${plan.maxSites} Website` });

        // 2. Custom Domain
        if (planFeatures.hasCustomDomain) coreFeatures.push("Bisa Pakai Domain Sendiri (.com/.id)");
        else coreFeatures.push(`Alamat Web Bawaan (.${cleanDomain})`);

        // 3. Quota Limits Mapping
        const quotaMapping = [
            { key: "maxProducts", label: "Maksimal Produk", featureKey: "hasProducts" },
            { key: "maxPosts", label: "Maksimal Artikel/Blog", featureKey: "hasBlog" },
            { key: "maxAssets", label: "Maksimal Upload Foto", featureKey: "hasGallery" },
            { key: "maxOrders", label: "Maksimal Transaksi", featureKey: "hasOrders" },
            { key: "maxTestimonials", label: "Maksimal Testimoni", featureKey: "hasTestimonials" },
        ];

        quotaMapping.forEach(q => {
            if (planFeatures[q.featureKey]) {
                const val = plan[q.key];
                limits.push({
                    label: q.label,
                    value: val === -1 ? "Sepuasnya" : `${val} Item`
                });
            }
        });

        // 4. Content Feature Booleans (Clean List)
        if (planFeatures.hasCart) coreFeatures.push("Fitur Toko Online (Keranjang)");
        if (planFeatures.hasPortfolio) coreFeatures.push("Galeri & Portofolio Karya");
        if (planFeatures.hasInbox) coreFeatures.push("Kotak Pesan Masuk (Inbox)");
        if (planFeatures.hasTaxonomies) coreFeatures.push("Bebas Buat Kategori/Label");

        // UI Logic
        let color = "blue";
        if (plan.price > 0) {
            color = "emerald";
        }
        if (plan.price > 100000) {
            color = "indigo";
        }

        return {
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: Number(plan.price),
            priceYearly: plan.priceYearly ? Number(plan.priceYearly) : null,
            originalPrice: plan.originalPrice ? Number(plan.originalPrice) : 0,
            originalPriceYearly: plan.originalPriceYearly ? Number(plan.originalPriceYearly) : 0,
            interval: plan.interval,
            trialDays: plan.trialDays || 0,
            color,
            displayPrice: formatPrice(plan.price),
            displayPriceYearly: plan.priceYearly ? formatPrice(plan.priceYearly) : null,
            displayOriginalPrice: plan.originalPrice ? formatPrice(plan.originalPrice) : null,
            displayOriginalPriceYearly: plan.originalPriceYearly ? formatPrice(plan.originalPriceYearly) : null,
            coreFeatures,
            limits,
            addonPrice: planFeatures.addonSitePrice ? formatPrice(planFeatures.addonSitePrice) : null,
            addonBilling: plan.addonSiteBilling === 'recurring' ? '/bulan' : ' (Sekali bayar)'
        };
    });
    console.log("[PricingPage] plans data to be rendered:", JSON.stringify(plans, null, 2));
    const maxTrialDays = Math.max(...dbPlans.map(p => p.trialDays || 0), 0);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-sky-500/20 selection:text-sky-600 font-sans relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-400/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <main className="relative z-10 pt-6 pb-8 md:pt-12 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="text-center mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-3 shadow-sm border border-sky-100/50">
                        <Sparkles size={12} /> Pilihan Harga
                    </div>
                    <h1 className="text-2xl md:text-5xl font-black tracking-tighter mb-3 leading-[1.05] md:leading-[0.95]">
                        Harga Ramah, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-sky-400 to-blue-500">Hasil Mewah</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
                        Sistem langganan yang masuk akal. Cukup pilih paket dasar, lalu tambah website baru kapan saja dengan <span className="text-slate-900 font-bold italic">harga super murah</span>.
                    </p>
                </div>

                {/* Pricing Cards Grid (Swipeable Bento) */}
                <PricingContent plans={plans} currency={currency} />

                {/* Trial & Suspension Policy Section */}
                <div className="max-w-5xl mx-auto mb-10 md:mb-16 px-4 sm:px-0">
                    <div className="text-center mb-6 md:mb-8">
                        <h2 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 mb-1.5 uppercase">
                            Kebijakan Trial & Keamanan Data
                        </h2>
                        <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
                            Kami percaya pada transparansi penuh. Berikut adalah kebijakan masa percobaan gratis dan penangguhan layanan situs Anda.
                        </p>
                    </div>

                    <div className="flex lg:grid lg:grid-cols-4 sm:grid sm:grid-cols-2 gap-3 lg:gap-5 overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-slate-100/50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar]:hidden snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 lg:pb-0">
                        {/* Card 1 */}
                        <div className="snap-start shrink-0 w-[72vw] sm:w-auto p-4 md:p-5 bg-white/70 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm hover:scale-[1.01] hover:shadow-sky-500/5 transition-all duration-300 hover:bg-white flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1">Akses Penuh 14 Hari</h3>
                                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                                    Gunakan seluruh fitur Premium tanpa batas gratis selama 14 hari penuh untuk menguji kelayakan bisnis Anda.
                                </p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="snap-start shrink-0 w-[72vw] sm:w-auto p-4 md:p-5 bg-white/70 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm hover:scale-[1.01] hover:shadow-sky-500/5 transition-all duration-300 hover:bg-white flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                                <Clock size={18} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1">Tanpa Kartu Kredit</h3>
                                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                                    Cukup daftar dengan email. Tidak ada penagihan otomatis, perpanjangan paksa, atau komitmen kartu kredit tersembunyi.
                                </p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="snap-start shrink-0 w-[72vw] sm:w-auto p-4 md:p-5 bg-white/70 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm hover:scale-[1.01] hover:shadow-sky-500/5 transition-all duration-300 hover:bg-white flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                                <RotateCcw size={18} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1">Ekstensi Trial</h3>
                                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                                    Butuh waktu lebih lama untuk mencoba? Perpanjang masa percobaan Anda selama 7 hari lagi secara gratis melalui dashboard.
                                </p>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div className="snap-start shrink-0 w-[72vw] sm:w-auto p-4 md:p-5 bg-white/70 backdrop-blur-md rounded-xl border border-slate-100 shadow-sm hover:scale-[1.01] hover:shadow-rose-500/5 transition-all duration-300 hover:bg-white flex flex-col gap-3">
                            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                <Database size={18} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1">Masa Grace 30 Hari</h3>
                                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed">
                                    Situs dinonaktifkan setelah trial habis, namun data Anda kami jamin 100% aman & tersimpan selama 30 hari masa tenggang.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Highly premium pulsing swipe prompt indicator for mobile */}
                    <div className="flex justify-center items-center gap-1.5 mt-3 sm:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                        <span>Geser untuk melihat detail</span>
                        <ArrowRight size={10} className="text-sky-500 animate-[bounce_1s_infinite]" />
                    </div>
                </div>

                {/* FAQ / Hybrid Explanation */}
                <div className="max-w-5xl mx-auto p-5 md:p-8 bg-sky-500 rounded-xl md:rounded-2xl relative overflow-hidden shadow-xl shadow-sky-500/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <h2 className="text-xl md:text-3xl font-black text-white mb-3 tracking-tighter">Kenapa Harga Kami Lebih Hemat?</h2>
                            <p className="text-white/95 text-xs md:text-sm leading-relaxed mb-4">
                                Anda <strong>tidak perlu beli paket mahal</strong> hanya untuk bikin website kedua. Cukup bayar biaya tambahan yang sangat murah, website baru Anda otomatis dapat fitur hebat yang sama persis dengan paket utama Anda.
                            </p>
                            <div className="flex items-center gap-2.5">
                                <div className="px-3 py-1.5 bg-white/10 rounded border border-white/20 text-white text-[9px] font-black uppercase tracking-wider">Jauh Lebih Hemat</div>
                                <div className="px-3 py-1.5 bg-white/10 rounded border border-white/20 text-white text-[9px] font-black uppercase tracking-wider">Bebas Tambah Web</div>
                            </div>
                        </div>
                        <div className="p-5 md:p-6 bg-white border border-white/20 rounded-xl shadow-md">
                            <h4 className="text-sky-600 font-bold mb-3 flex items-center gap-1.5 uppercase text-[10.5px] tracking-wider">
                                <Zap size={14} /> Yuk, Mulai Sekarang
                            </h4>
                            <p className="text-slate-600 text-xs mb-5 leading-relaxed">
                                Masih ragu? Cobain dulu <strong>Gratis selama {maxTrialDays} hari</strong> atau pakai paket Gratis selamanya buat sekadar coba-coba kelengkapan fitur kami.
                            </p>
                            <Link href="/register" className="w-full py-3 bg-sky-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest text-center block hover:scale-[1.02] transition-transform shadow-md shadow-sky-500/20">
                                Bikin Akun Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
