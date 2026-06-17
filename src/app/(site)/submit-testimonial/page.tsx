"use client";

import React, { useState } from "react";
import { Star, Send, CheckCircle, ArrowLeft, MessageSquareQuote, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function SubmitTestimonialPage() {
    const [formData, setFormData] = useState({
        author: "",
        role: "",
        quote: "",
        rating: 5
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/testimonials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.error || "Gagal mengirim testimoni");
            }
        } catch (_err) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-card text-card-foreground max-w-sm w-full p-6 rounded-xl shadow-sm border border-border text-center space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Terima Kasih!</h1>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Testimoni Anda telah kami terima dan akan ditampilkan setelah melalui proses moderasi.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                    >
                        <ArrowLeft size={12} /> Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl">
                {/* Back link */}
                <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft size={13} /> Kembali
                </Link>

                {/* Card wrapper */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-5">

                        {/* ── LEFT PANEL: branding & info ── */}
                        <div className="lg:col-span-2 bg-primary/5 border-b lg:border-b-0 lg:border-r border-border p-6 lg:p-8 flex flex-col justify-between gap-6">
                            <div>
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                    <MessageSquareQuote size={20} className="text-primary" />
                                </div>
                                <h1 className="text-xl font-bold text-foreground leading-snug mb-2">
                                    Kirim Testimoni
                                </h1>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Pengalaman Anda sangat berarti bagi kami dan membantu orang lain membuat keputusan yang lebih baik.
                                </p>
                            </div>

                            {/* Info points */}
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center flex-shrink-0">
                                        <Shield size={13} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-foreground">Aman & Terverifikasi</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">Setiap testimoni melalui proses moderasi sebelum ditampilkan.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center flex-shrink-0">
                                        <Clock size={13} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold text-foreground">Proses Cepat</p>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">Testimoni biasanya ditinjau dalam 1×24 jam kerja.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative stars */}
                            <div className="flex gap-0.5 opacity-20">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="text-primary" fill="currentColor" />
                                ))}
                            </div>
                        </div>

                        {/* ── RIGHT PANEL: form ── */}
                        <div className="lg:col-span-3 p-6 lg:p-8">
                            {error && (
                                <div className="mb-4 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-md text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name + Role side by side on desktop */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="testimonial-name" className="block text-xs font-semibold text-foreground mb-1.5">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="testimonial-name"
                                            required
                                            type="text"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-1 focus:ring-primary/30 focus:border-primary/50 outline-none transition placeholder:text-muted-foreground/40"
                                            placeholder="Budi Santoso"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="testimonial-role" className="block text-xs font-semibold text-foreground mb-1.5">
                                            Peran / Jabatan <span className="text-muted-foreground font-normal">(opsional)</span>
                                        </label>
                                        <input
                                            id="testimonial-role"
                                            type="text"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-1 focus:ring-primary/30 focus:border-primary/50 outline-none transition placeholder:text-muted-foreground/40"
                                            placeholder="CEO di Tech Company"
                                        />
                                    </div>
                                </div>

                                {/* Rating */}
                                <div>
                                    <span className="block text-xs font-semibold text-foreground mb-1.5">Rating</span>
                                    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                role="radio"
                                                aria-checked={formData.rating === star}
                                                aria-label={`${star} bintang`}
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                className="transition-transform active:scale-90"
                                            >
                                                <Star
                                                    size={22}
                                                    className={`transition-colors ${formData.rating >= star ? "text-yellow-400" : "text-muted-foreground/20"}`}
                                                    fill={formData.rating >= star ? "currentColor" : "none"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Testimonial textarea */}
                                <div>
                                    <label htmlFor="testimonial-quote" className="block text-xs font-semibold text-foreground mb-1.5">
                                        Testimoni <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="testimonial-quote"
                                        required
                                        value={formData.quote}
                                        onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:ring-1 focus:ring-primary/30 focus:border-primary/50 outline-none h-36 resize-none transition placeholder:text-muted-foreground/40 leading-relaxed"
                                        placeholder="Ceritakan pengalaman Anda..."
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Mengirim...</span>
                                    ) : (
                                        <>
                                            <Send size={14} /> Kirim Testimoni
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
