import React from "react";
import { 
    CheckCircle2, 
    Circle, 
    Clock, 
    Rocket, 
    Zap, 
    Bot, 
    Smartphone, 
    CreditCard, 
    Store, 
    Globe, 
    BarChart3,
    ArrowRight
} from "lucide-react";
import { LazyLink as Link } from "@/components/ui/LazyLink";
import Image from "next/image";
import { getPlatformSettings } from "@/lib/settings/platform";
import { getTenant } from "@/lib/domains/tenant";
import { fetchRoadmapData } from "@/lib/github/project";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 3600; // Cache page statically for 1 hour (ISR)

export async function generateMetadata(): Promise<Metadata> {
    const platform = await getPlatformSettings();
    return {
        title: `Roadmap Pengembangan - ${platform.siteName}`,
        description: `Lihat rencana pengembangan, rilis fitur baru, dan arah masa depan platform ${platform.siteName}.`
    };
}

export default async function RoadmapPage() {
    const subdomain = await getTenant();
    if (subdomain) {
        notFound();
    }
    const platform = await getPlatformSettings();
    const siteName = platform.siteName;

    const githubData = await fetchRoadmapData();

    let roadmapData = [
        {
            status: "Launched",
            title: "Q1 2026: Pondasi Kuat",
            description: "Fokus pada stabilitas sistem dan fitur inti e-commerce.",
            items: [
                { title: "Sistem Manajemen Produk", icon: <Store className="w-4 h-4" />, completed: true },
                { title: "Checkout & Billing Terpadu", icon: <CreditCard className="w-4 h-4" />, completed: true },
                { title: "Editor Halaman Visual", icon: <Zap className="w-4 h-4" />, completed: true },
                { title: "Optimasi SEO Otomatis", icon: <Globe className="w-4 h-4" />, completed: true },
            ],
            color: "bg-green-500",
            lightColor: "bg-green-50",
            textColor: "text-green-700"
        },
        {
            status: "In Progress",
            title: "Q2 2026: Inovasi & AI",
            description: "Membawa kecerdasan buatan untuk membantu operasional UMKM.",
            items: [
                { title: "AI Chatbot Customer Service", icon: <Bot className="w-4 h-4" />, completed: false },
                { title: "Aplikasi Mobile Merchant", icon: <Smartphone className="w-4 h-4" />, completed: false },
                { title: "Integrasi Logistik Nasional", icon: <Rocket className="w-4 h-4" />, completed: false },
                { title: "Dashboard Analitik Pro", icon: <BarChart3 className="w-4 h-4" />, completed: false },
            ],
            color: "bg-primary",
            lightColor: "bg-sky-50",
            textColor: "text-primary"
        },
        {
            status: "Planned",
            title: "Q3 - Q4 2026: Ekspansi Ekosistem",
            description: "Menghubungkan UMKM ke pasar global dan sistem offline.",
            items: [
                { title: "Sistem Point of Sale (POS)", icon: <Store className="w-4 h-4" />, completed: false },
                { title: "Portal Grosir & B2B", icon: <Zap className="w-4 h-4" />, completed: false },
                { title: "Multi-Language & Currency", icon: <Globe className="w-4 h-4" />, completed: false },
                { title: "Prediksi Stok Berbasis AI", icon: <Bot className="w-4 h-4" />, completed: false },
            ],
            color: "bg-slate-400",
            lightColor: "bg-slate-50",
            textColor: "text-slate-600"
        }
    ];

    if (githubData && githubData.length > 0) {
        const doneItems = githubData.filter(item => item.status === "Done");
        const inProgressItems = githubData.filter(item => item.status === "In Progress");
        const todoItems = githubData.filter(item => item.status === "Todo");

        roadmapData = [
            {
                status: "Launched",
                title: "Telah Selesai",
                description: "Pembaruan sistem dan fitur yang telah berhasil diluncurkan ke platform.",
                items: doneItems.map(item => ({
                    title: item.title,
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    completed: true
                })),
                color: "bg-green-500",
                lightColor: "bg-green-50",
                textColor: "text-green-700"
            },
            {
                status: "In Progress",
                title: "Sedang Dikerjakan",
                description: "Tugas dan fitur yang saat ini sedang aktif dalam tahap pengembangan tim.",
                items: inProgressItems.map(item => ({
                    title: item.title,
                    icon: <Rocket className="w-4 h-4" />,
                    completed: false
                })),
                color: "bg-primary",
                lightColor: "bg-sky-50",
                textColor: "text-primary"
            },
            {
                status: "Planned",
                title: "Direncanakan",
                description: "Daftar permintaan fitur dan ide cemerlang yang telah masuk ke antrean kami.",
                items: todoItems.map(item => ({
                    title: item.title,
                    icon: <Clock className="w-4 h-4" />,
                    completed: false
                })),
                color: "bg-slate-400",
                lightColor: "bg-slate-50",
                textColor: "text-slate-600"
            }
        ].filter(group => group.items.length > 0);
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="pt-12 pb-24 md:pt-24 md:pb-32">
                {/* Hero Section */}
                <section className="px-5 mb-12 md:mb-24">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Clock size={14} /> Roadmap Produk
                        </div>
                        <h1 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]">
                            Inovasi Kami <span className="text-primary">Tiada Henti.</span>
                        </h1>
                        <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto px-4 md:px-0">
                            Kami percaya transparansi adalah kunci kepercayaan. Lihat bagaimana kami mengembangkan {siteName} untuk menjadi ekosistem digital terbaik bagi UMKM Indonesia.
                        </p>
                    </div>
                </section>

                {/* Roadmap Grid */}
                <section className="px-4">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roadmapData.map((phase, idx) => (
                            <div key={idx} className="relative group">
                                {/* Status Header */}
                                <div className={`flex items-center justify-between mb-4 p-3 rounded-xl ${phase.lightColor}`}>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${phase.textColor}`}>
                                        {phase.status}
                                    </span>
                                    <div className={`w-2 h-2 rounded-full ${phase.color} animate-pulse`} />
                                </div>

                                {/* Content Card */}
                                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full">
                                    <h2 className="text-lg font-bold text-slate-900 mb-2">{phase.title}</h2>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-6">{phase.description}</p>
                                    
                                    <div className="space-y-4 flex-1">
                                        {phase.items.map((item, iidx) => (
                                            <div key={iidx} className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${item.completed ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className={`text-xs font-bold leading-tight ${item.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                                                            {item.title}
                                                        </h4>
                                                        {item.completed ? (
                                                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                                                        ) : (
                                                            <Circle size={14} className="text-slate-200 shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom Decorative Element */}
                                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex -space-x-1.5">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="relative w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                                                    <Image 
                                                        src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                                                        alt="dev" 
                                                        sizes="24px" fill
                                                        className="object-cover grayscale" 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Dev Team</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Feedback CTA */}
                <section className="max-w-4xl mx-auto mt-16 md:mt-32 px-5 text-center">
                    <div className="bg-slate-950 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Punya Usulan Fitur?</h2>
                            <p className="text-sm md:text-base text-slate-400 mb-8 md:mb-10 max-w-lg mx-auto">
                                Kami membangun platform ini untuk Anda. Masukan Anda sangat berharga bagi kami dalam menyusun prioritas roadmap selanjutnya.
                            </p>
                            <Link href="/contact" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform text-sm">
                                Kirim Feedback <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
