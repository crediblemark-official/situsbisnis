import React from "react";
import { AlertTriangle, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ExpiredSiteViewProps {
    status: "expired" | "grace_period" | "no_subscription";
    siteName: string;
    platformName?: string;
}

export const ExpiredSiteView = ({ status, siteName, platformName = "SitusBisnis" }: ExpiredSiteViewProps) => {
    const isGrace = status === "grace_period";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                <div className="bg-red-500 p-8 flex justify-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle className="text-white" size={40} />
                    </div>
                </div>

                <div className="p-8 text-center">
                    <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                        Website Ditangguhkan
                    </h1>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                        Akses publik untuk <span className="font-bold text-slate-900">{siteName}</span> saat ini dinonaktifkan karena masa trial/berlangganan telah berakhir.
                    </p>

                    <div className="space-y-3">
                        <Link
                            href="/dashboard/billing"
                            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                        >
                            <CreditCard size={14} /> Aktifkan Sekarang
                        </Link>

                        <div className="pt-4 border-t border-slate-100 mt-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                {isGrace
                                    ? "Data Anda Aman (Masa Grace 30 Hari)"
                                    : "Masa Grace Telah Berakhir"}
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest hover:gap-3 transition-all"
                            >
                                Login jika ini milik Anda <ArrowRight size={12} />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 text-center">
                    <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest">
                        Powered by {platformName}
                    </p>
                </div>
            </div>
        </div>
    );
};
