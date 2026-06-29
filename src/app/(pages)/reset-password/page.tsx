"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

function ResetPasswordForm() {

    const { settings } = usePlatformSettings();
    const siteName = settings?.siteName || "SitusBisnis";
    
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        if (!token) {
            setError("Token reset tidak ditemukan atau tidak valid.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak cocok.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/password/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Gagal mengatur ulang kata sandi.");
                setLoading(false);
                return;
            }

            setSuccess(true);
            setMessage(data.message || "Kata sandi Anda telah berhasil diperbarui.");
        } catch {
            setError("Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
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
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Reset Password</h1>
                <p className="text-white text-[10px] font-bold uppercase tracking-widest">Sistem Pemulihan Akun</p>
            </div>

            {/* Container */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {!token ? (
                    <div className="text-center space-y-6">
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                            Tautan tidak valid
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Tautan pengaturan ulang kata sandi ini tidak valid atau tidak memiliki token yang diperlukan.
                        </p>
                        <Link
                            href="/forgot-password"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                        >
                            Minta Link Baru
                        </Link>
                    </div>
                ) : success ? (
                    <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="flex justify-center text-primary">
                            <CheckCircle2 size={48} className="animate-bounce" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-slate-800">Password Diperbarui!</h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group"
                        >
                            Masuk Sekarang <ArrowLeft size={16} className="rotate-180" />
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
                            Masukkan password baru minimal 8 karakter untuk mengamankan akun Anda kembali.
                        </p>

                        <div className="space-y-1.5">
                            <label htmlFor="reset-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password Baru</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="reset-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="confirm-reset-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ulangi Password Baru</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    id="confirm-reset-password"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-primary transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                "Simpan Password Baru"
                            )}
                        </button>
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
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary p-6 font-sans text-slate-900">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center text-white space-y-4">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest">Memuat Halaman...</p>
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
