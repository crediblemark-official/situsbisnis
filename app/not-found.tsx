import { getPlatformSettings } from "@/lib/settings/platform";
import Link from "next/link";
import { MoveRight, Globe, Sparkles } from "lucide-react";

export default async function NotFound() {
    const mainDomain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const platform = await getPlatformSettings();

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
            <div className="max-w-2xl w-full">
                {/* Icon/Visual */}
                <div className="relative inline-flex mb-8">
                    <div className="absolute inset-0 bg-sky-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                    <div className="relative bg-white border border-sky-100 p-6 rounded-3xl shadow-xl shadow-sky-500/5">
                        <Globe className="w-16 h-16 text-sky-500 animate-bounce" />
                    </div>
                </div>

                {/* Content */}
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                    Oops! Alamat ini <br/>
                    <span className="text-sky-500 underline decoration-sky-100 decoration-8 underline-offset-8">Masih Tersedia.</span>
                </h1>
                
                <p className="text-lg text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
                    Sepertinya subdomain ini belum ada yang punya. Ini adalah kesempatan emas Anda untuk membangun kehadiran digital yang profesional di <strong>{platform.siteName}</strong>.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link 
                        href={`${mainDomain}/register`} 
                        className="w-full sm:w-auto px-8 py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/25 hover:bg-sky-600 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                        <Sparkles className="w-5 h-5" />
                        Buat Website Sekarang
                        <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <Link 
                        href={mainDomain} 
                        className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center"
                    >
                        Kembali ke Beranda
                    </Link>
                </div>

                {/* Secondary Info */}
                <div className="mt-16 pt-8 border-t border-slate-100">
                    <p className="text-sm text-slate-400">
                        Sudah punya akun? <Link href={`${mainDomain}/login`} className="text-sky-500 font-semibold hover:underline">Masuk ke Dashboard</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
