"use client";

import { useState, useMemo } from "react";
import { Globe, Layout, Loader2, ChevronRight, Store, AlertCircle } from "lucide-react";
import { useHostname } from "@/hooks/use-hostname";
import Image from "next/image";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { completeOnboardingAction } from "@/modules/auth/public-actions";

export default function OnboardingPage() {
    const { settings } = usePlatformSettings();
    const siteNamePlatform = settings?.siteName || "SitusBisnis";

    const [siteName, setSiteName] = useState("");
    const [subdomain, setSubdomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const host = useHostname();
    const rootDomain = useMemo(() => {
        if (!host) return "...";
        let detectedRoot = "localhost:3000";

        if (host.includes("localhost")) {
            detectedRoot = "localhost:3000";
        } else {
            const parts = host.split(".");
            if (parts.length >= 2) {
                detectedRoot = parts.slice(-2).join(".");
            } else {
                detectedRoot = host;
            }
        }
        return detectedRoot;
    }, [host]);

    const [prevHost, setPrevHost] = useState(host);
    if (host !== prevHost) {
        setPrevHost(host);
        if (host && rootDomain !== "...") {
            if (host.includes(`.${rootDomain}`)) {
                const sub = host.replace(`.${rootDomain}`, "");
                if (sub && sub !== "www") {
                    setSubdomain(sub);
                }
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await completeOnboardingAction({ siteName, subdomain });

            if (data.success && data.site) {
                // Redirect to the new site's dashboard
                // We use the rootDomain we detected in useEffect
                const targetUrl = `${window.location.protocol}//${data.site.subdomain}.${rootDomain}/dashboard`;
                window.location.href = targetUrl;
            } else {
                setError(data.error || "Gagal buat situs");
                setLoading(false);
            }
        } catch {
            setError("Sistem error.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-6 font-sans">
            <div className="w-full max-w-[500px]">
                {/* Progress Header */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative w-16 h-16 mx-auto mb-6 transition-transform hover:scale-105">
                        <Image
                            src={settings?.logoUrl || "/brand/logo.svg"}
                            alt={`${siteNamePlatform} Logo`}
                            fill
                            sizes="64px"
                            priority
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Siapkan Situs</h1>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Tahap Akhir</p>
                </div>

                {/* Onboarding Container */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                                {error.includes("User not found") && (
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = "/api/auth/signout"}
                                        className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-all"
                                    >
                                        Keluar & Ulangi
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="onboarding-site-name" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nama Situs</label>
                            <div className="relative group">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="onboarding-site-name"
                                    type="text"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/50 outline-none focus:border-primary transition-all"
                                    placeholder="Toko Kue Kencana"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="onboarding-subdomain" className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Alamat Situs (Subdomain)</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 group">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        id="onboarding-subdomain"
                                        type="text"
                                        value={subdomain}
                                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground/50 outline-none focus:border-primary transition-all"
                                        placeholder="tokokue"
                                        required
                                    />
                                </div>
                                <span className="text-xs font-bold text-muted-foreground">.{rootDomain}</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-1 px-1 italic">Hanya huruf kecil & angka.</p>
                        </div>

                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                            <div className="flex items-start gap-3">
                                <Layout size={16} className="text-primary mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">Otomatis</p>
                                    <p className="text-[9px] text-muted-foreground">Halaman beranda, menu, dan SEO akan disiapkan otomatis.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    Buat Sekarang <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Powered by {siteNamePlatform}</p>
                </div>
            </div>
        </div>
    );
}
