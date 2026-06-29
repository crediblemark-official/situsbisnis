"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export default function LoginPage() {
    const router = useRouter();
    const { settings } = usePlatformSettings();
    const siteName = settings?.siteName || "SitusBisnis";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                // NextAuth typically returns a generic message or the thrown error
                // We'll handle both cases
                if (result.error.includes("Email")) {
                    setError("Email tidak terdaftar.");
                } else if (result.error.includes("password")) {
                    setError("Password salah.");
                } else {
                    setError("Kredensial tidak valid.");
                }
                setLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch {
            setError("Gagal masuk ke sistem.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary p-6 font-sans text-slate-900">
            <div className="w-full max-w-[400px]">
                {/* Branding Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative w-16 h-16 mx-auto mb-6 transition-transform hover:scale-105">
                        <Image
                            src={settings?.logoUrl || "/brand/logo.svg"}
                            alt={`${siteName} Logo`}
                            fill
                            sizes="64px"
                            priority
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Masuk Panel</h1>
                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">Sistem Aman</p>
                </div>

                {/* Login Container */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg animate-in shake duration-500">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="login-email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-all"
                                    placeholder="admin@cms.internal"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label htmlFor="login-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                                <Link href="/forgot-password" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                                    Lupa Password?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                    title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                >
                                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                                </button>
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
                                    Masuk <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Belum punya akun?{" "}
                            <Link href="/register" className="text-primary underline hover:text-primary/80 transition-colors">Buat Akun</Link>
                        </p>
                    </div>
                </div>

                {/* Technical Info */}
                <div className="mt-8 flex items-center justify-center gap-4 text-[9px] font-bold text-white uppercase tracking-widest">
                    <span>Build v1.0.4-Stable</span>
                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                    <span>Edge Encrypted</span>
                </div>
            </div>
        </div>
    );
}
