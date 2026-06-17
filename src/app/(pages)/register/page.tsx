"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, ChevronRight, User, Phone, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { registerUserAction, checkAffiliateAction } from "@/modules/auth";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [cookieRef, setCookieRef] = useState<string | null>(null);
    
    const referralCode = searchParams?.get("ref") || cookieRef || undefined;
    const { settings } = usePlatformSettings();
    const siteName = settings?.siteName || "SitusBisnis";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [referrerName, setReferrerName] = useState<string | null>(null);

    const [touched, setTouched] = useState({
        name: false,
        email: false,
        phone: false,
        password: false
    });

    const isEmailValid = (val: string) => {
        if (!val) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    };

    const isPhoneValid = (val: string) => {
        if (!val) return false;
        let formattedPhone = val.replace(/[^0-9]/g, "");
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "62" + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith("8")) {
            formattedPhone = "62" + formattedPhone;
        }
        const isIndonesian = /^628[1-9]\d{7,11}$/.test(formattedPhone);
        const isInternational = /^[1-9]\d{8,14}$/.test(formattedPhone) && !formattedPhone.startsWith("628");
        return isIndonesian || isInternational;
    };

    const isNameValid = (val: string) => val.trim().length >= 2;
    const isPasswordValid = (val: string) => val.length >= 8;

    // Read cookie on mount to avoid hydration mismatch
    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
            return null;
        };
        setTimeout(() => {
            setCookieRef(getCookie("affiliate_ref"));
        }, 0);
    }, []);

    // Fetch referrer name if referralCode exists
    useEffect(() => {
        if (referralCode) {
            checkAffiliateAction(referralCode)
                .then(data => {
                    if (data.exists && data.name) {
                        setReferrerName(data.name);
                    }
                })
                .catch(console.error);
        }
    }, [referralCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Mark all fields as touched to trigger warnings
        setTouched({
            name: true,
            email: true,
            phone: true,
            password: true
        });

        if (!name.trim()) {
            setError("Nama Lengkap wajib diisi.");
            return;
        }
        if (!isNameValid(name)) {
            setError("Nama Lengkap minimal harus 2 karakter.");
            return;
        }
        if (!email) {
            setError("Email wajib diisi.");
            return;
        }
        if (!isEmailValid(email)) {
            setError("Format email tidak valid.");
            return;
        }
        if (!phone) {
            setError("Nomor HP wajib diisi.");
            return;
        }
        if (!isPhoneValid(phone)) {
            setError("Format nomor HP tidak valid. Gunakan format yang benar (contoh: 0812xxx atau +62812xxx).");
            return;
        }
        if (!password) {
            setError("Password wajib diisi.");
            return;
        }
        if (!isPasswordValid(password)) {
            setError("Password harus minimal 8 karakter.");
            return;
        }

        setLoading(true);

        // Clean to digits only for standardization (suitable for StarSender)
        let formattedPhone = phone.replace(/[^0-9]/g, "");
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "62" + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith("8")) {
            formattedPhone = "62" + formattedPhone;
        }

        try {
            const data = await registerUserAction({ name, email, password, phone: formattedPhone, referralCode });

            if (data.success) {
                // Automatically sign in the user after registration
                const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                if (result?.error) {
                    router.push("/login?registered=true");
                } else {
                    router.push("/onboarding");
                    router.refresh();
                }
            } else {
                setError(data.error || "Gagal daftar.");
                setLoading(false);
            }
        } catch {
            setError("Gagal terhubung ke sistem.");
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
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Buat Akun</h1>
                    <p className="text-white text-[10px] font-bold uppercase tracking-widest">Gabung Ekosistem {siteName}</p>
                </div>

                {/* Register Container */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-lg animate-in shake duration-500">
                                {error}
                            </div>
                        )}

                        {referralCode && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-4 text-center">
                                Diundang oleh: {referrerName ? referrerName : "Pengguna Afiliasi"}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="register-name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label>
                            <div className="relative group">
                                <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                                    touched.name
                                        ? (!name.trim() || !isNameValid(name) ? "text-red-500" : "text-emerald-500")
                                        : "text-slate-400 group-focus-within:text-primary"
                                }`} size={18} />
                                <input
                                    id="register-name"
                                    name="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (touched.name) {
                                            setError("");
                                        }
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
                                        touched.name
                                            ? (!name.trim() || !isNameValid(name) ? "border-red-500 focus:border-red-500 bg-red-50/5" : "border-emerald-500 focus:border-emerald-500 bg-emerald-50/5")
                                            : "border-slate-200 focus:border-primary"
                                    }`}
                                    placeholder="Budi Santoso"
                                    required
                                />
                            </div>
                            {touched.name && !name.trim() && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Nama Lengkap wajib diisi.
                                </p>
                            )}
                            {touched.name && name.trim() && !isNameValid(name) && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Nama harus minimal 2 karakter.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="register-email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                                    touched.email
                                        ? (!email || !isEmailValid(email) ? "text-red-500" : "text-emerald-500")
                                        : "text-slate-400 group-focus-within:text-primary"
                                }`} size={18} />
                                <input
                                    id="register-email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (touched.email) {
                                            setError("");
                                        }
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
                                        touched.email
                                            ? (!email || !isEmailValid(email) ? "border-red-500 focus:border-red-500 bg-red-50/5" : "border-emerald-500 focus:border-emerald-500 bg-emerald-50/5")
                                            : "border-slate-200 focus:border-primary"
                                    }`}
                                    placeholder="budi@example.com"
                                    required
                                />
                            </div>
                            {touched.email && !email && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Email wajib diisi.
                                </p>
                            )}
                            {touched.email && email && !isEmailValid(email) && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Format email tidak valid (contoh: budi@example.com).
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="register-phone" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nomor HP</label>
                            <div className="relative group">
                                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                                    touched.phone
                                        ? (!phone || !isPhoneValid(phone) ? "text-red-500" : "text-emerald-500")
                                        : "text-slate-400 group-focus-within:text-primary"
                                }`} size={18} />
                                <input
                                    id="register-phone"
                                    name="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        setPhone(e.target.value);
                                        if (touched.phone) {
                                            setError("");
                                        }
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                                    className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
                                        touched.phone
                                            ? (!phone || !isPhoneValid(phone) ? "border-red-500 focus:border-red-500 bg-red-50/5" : "border-emerald-500 focus:border-emerald-500 bg-emerald-50/5")
                                            : "border-slate-200 focus:border-primary"
                                    }`}
                                    placeholder="081234567890"
                                    required
                                />
                            </div>
                            {touched.phone && !phone && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Nomor HP wajib diisi.
                                </p>
                            )}
                            {touched.phone && phone && !isPhoneValid(phone) && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Format nomor HP tidak valid. Gunakan format 0812xxx atau +62812xxx.
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="register-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                                    touched.password
                                        ? (!password || !isPasswordValid(password) ? "text-red-500" : "text-emerald-500")
                                        : "text-slate-400 group-focus-within:text-primary"
                                }`} size={18} />
                                <input
                                    id="register-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (touched.password) {
                                            setError("");
                                        }
                                    }}
                                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                    className={`w-full pl-10 pr-10 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
                                        touched.password
                                            ? (!password || !isPasswordValid(password) ? "border-red-500 focus:border-red-500 bg-red-50/5" : "border-emerald-500 focus:border-emerald-500 bg-emerald-50/5")
                                            : "border-slate-200 focus:border-primary"
                                    }`}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
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
                            {touched.password && !password && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Password wajib diisi.
                                </p>
                            )}
                            {touched.password && password && !isPasswordValid(password) && (
                                <p className="text-red-500 text-[10px] mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                                    Password harus minimal 8 karakter.
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2 group disabled:opacity-50 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    Daftar <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Sudah punya akun?{" "}
                            <Link href="/login" className="text-primary underline hover:text-primary/80 transition-colors">Masuk</Link>
                        </p>
                    </div>
                </div>

                {/* Technical Info */}
                <div className="mt-8 flex items-center justify-center gap-4 text-[9px] font-bold text-white uppercase tracking-widest">
                    <span>Cloud Native</span>
                    <span className="w-1 h-1 bg-white/40 rounded-full" />
                    <span>Secure Registration</span>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-primary">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
