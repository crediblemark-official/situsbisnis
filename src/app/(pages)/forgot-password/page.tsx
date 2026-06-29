"use client";

import { useState } from "react";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export default function ForgotPasswordPage() {
    const { settings } = usePlatformSettings();
    const siteName = settings?.siteName || "SitusBisnis";
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Gagal mengirim permintaan reset password.");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setMessage(data.message || "Tautan reset password telah dikirim ke email Anda.");
        } catch {
            setError("Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.");
        } finally {
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
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Lupa Password</h1>
                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">Sistem Pemulihan Akun</p>
                </div>

                {/* Container */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {success ? (
                        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="flex justify-center text-primary">
                                <CheckCircle2 size={48} className="animate-bounce" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-bold text-slate-800">Email Terkirim!</h2>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {message}
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group"
                            >
                                <ArrowLeft size={16} /> Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg animate-in shake duration-500">
                                    {error}
                                </div>
                            )}

                            <p className="text-xs text-slate-500 leading-relaxed text-center">
                                Masukkan email terdaftar Anda. Kami akan mengirimkan instruksi dan tautan khusus untuk mengatur ulang password Anda.
                            </p>

                            <div className="space-y-1.5">
                                <label htmlFor="reset-email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Anda</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        id="reset-email"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-all"
                                        placeholder="nama@email.com"
                                        required
                                    />
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
                                    "Kirim Link Reset"
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-primary uppercase tracking-widest transition-colors"
                                >
                                    <ArrowLeft size={12} /> Kembali ke Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>

                {/* Technical Info */}
                <div className="mt-8 flex items-center justify-center gap-4 text-[9px] font-bold text-white uppercase tracking-widest">
                    <span>Secure Verification</span>
                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                    <span>SSL Encrypted</span>
                </div>
            </div>
        </div>
    );
}
