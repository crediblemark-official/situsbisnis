"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, ShieldCheck, Loader2, Lock, Landmark, CreditCard, Check, Copy } from "lucide-react";
import { formatPrice } from "@/lib/billing/currency";

interface ExpressCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    activePrice: number;
    currency: string;
    brandColor: string;
    selectedOptions: Record<string, string>;
    variantName?: string;
}

const PAYMENT_LOGOS = [
    { name: "QRIS", src: "/logo-pembayaran/QRIS.svg", heightClass: "h-3" },
    { name: "GoPay", src: "/logo-pembayaran/JP.svg", heightClass: "h-3" },
    { name: "ShopeePay", src: "/logo-pembayaran/FT.svg", heightClass: "h-3" },
    { name: "OVO", src: "/logo-pembayaran/OV.svg", heightClass: "h-3" },
    { name: "DANA", src: "/logo-pembayaran/DA.svg", heightClass: "h-3" },
    { name: "Visa / Mastercard", src: "/logo-pembayaran/VC.svg", heightClass: "h-3" },
    { name: "BCA", src: "/logo-pembayaran/BC.svg", heightClass: "h-3" },
    { name: "Mandiri", src: "/logo-pembayaran/M2.svg", heightClass: "h-2.5" },
    { name: "BNI", src: "/logo-pembayaran/I1.svg", heightClass: "h-3" },
    { name: "BRI", src: "/logo-pembayaran/BR.svg", heightClass: "h-3" }
];

export function ExpressCheckoutModal({
    isOpen,
    onClose,
    product,
    activePrice,
    currency,
    brandColor = "#ee4d2d",
    selectedOptions,
    variantName
}: ExpressCheckoutModalProps) {
    const { data: session } = useSession();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<"system" | "manual">("system");
    const [copied, setCopied] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });

    // Prefill form details from session when loaded
    useEffect(() => {
        if (session?.user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => {
                const targetName = session.user?.name || prev.name;
                const targetEmail = session.user?.email || prev.email;
                if (prev.name === targetName && prev.email === targetEmail) {
                    return prev;
                }
                return {
                    ...prev,
                    name: targetName,
                    email: targetEmail
                };
            });
        }
    }, [session]);

    // Fetch active payment settings
    useEffect(() => {
        if (isOpen) {
            fetch("/api/settings/payments")
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setPaymentSettings(data);
                        if (!data.duitkuEnabled && data.bankName) {
                            setPaymentMethod("manual");
                        }
                    }
                })
                .catch(err => console.error("[ExpressCheckoutModal] Failed to fetch payment settings:", err));
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const copyToClipboard = () => {
        if (paymentSettings?.accountNumber) {
            navigator.clipboard.writeText(paymentSettings.accountNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    paymentMethod: paymentMethod,
                    items: [
                        {
                            productId: product.id,
                            quantity: 1,
                            price: Number(activePrice),
                            variantName: variantName,
                            attributes: selectedOptions
                        }
                    ]
                })
            });

            if (!res.ok) throw new Error("ExpressCheckout failed");

            const data = await res.json();
            const orderId = data.id;

            onClose();

            if (data.paymentUrl) {
                router.push(`/checkout/payment/${orderId}`);
            } else {
                router.push(`/checkout/success?orderId=${orderId}`);
            }
        } catch (err) {
            console.error("[ExpressCheckoutSubmitError]", err);
            alert("Gagal memproses pesanan otomatis. Silakan coba kembali.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const hasManual = !!(paymentSettings?.bankName && paymentSettings?.accountNumber);
    const hasDuitku = !!paymentSettings?.duitkuEnabled;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
            {/* Backdrop with elegant blur */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Box */}
            <div className="relative w-full h-full sm:h-auto max-w-none sm:max-w-lg bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-100 overflow-hidden mx-0 sm:mx-4 max-h-screen sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div 
                            className="p-1.5 rounded-lg text-white"
                            style={{ backgroundColor: brandColor }}
                        >
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Express Checkout</h3>
                            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Produk Digital • 3 Langkah Instan</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 [scrollbar-width:thin]">
                    {/* Brief Product summary card */}
                    <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={product.images[0]} 
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200/50 bg-white" 
                                alt={product.name} 
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{product.name}</h4>
                            {variantName && (
                                <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Varian: {variantName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-black text-slate-800" style={{ color: brandColor }}>
                                    {formatPrice(activePrice, currency)}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    Unduh Instan
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information form */}
                    <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Detail Penerima Akses</h4>
                        
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="name-input" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">Nama Lengkap</label>
                                <input
                                    id="name-input"
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Masukkan nama lengkap Anda"
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="email-input" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">Alamat Email</label>
                                    <input
                                        id="email-input"
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="nama@email.com"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all placeholder:text-slate-400"
                                    />
                                    <span className="text-[8px] text-slate-400 font-semibold mt-1 block ml-0.5">File akses dikirim ke email ini.</span>
                                </div>
                                <div>
                                    <label htmlFor="phone-input" className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-0.5">Nomor WhatsApp</label>
                                    <input
                                        id="phone-input"
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="Contoh: 08123456789"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-slate-400 transition-all placeholder:text-slate-400"
                                    />
                                    <span className="text-[8px] text-slate-400 font-semibold mt-1 block ml-0.5">Nomor aktif untuk konfirmasi manual.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment methods selector */}
                    {paymentSettings && (hasDuitku || hasManual) && (
                        <div className="space-y-3 pt-1 border-t border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Metode Pembayaran</h4>
                            
                            {hasDuitku && hasManual && (
                                <div className="grid grid-cols-2 gap-2 bg-slate-100/60 p-1 rounded-xl border border-slate-200/40">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("system")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                                            paymentMethod === "system"
                                                ? "bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        <CreditCard size={13} />
                                        Instan / Otomatis
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("manual")}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                                            paymentMethod === "manual"
                                                ? "bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        <Landmark size={13} />
                                        Manual Transfer
                                    </button>
                                </div>
                            )}

                            {paymentMethod === "system" && hasDuitku ? (
                                <div className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 space-y-3.5 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h5 className="font-bold text-slate-800 text-xs">Sistem Gerbang Pembayaran Otomatis</h5>
                                            <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">QRIS, E-wallet, Virtual Account, & Kartu Kredit didukung.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        {PAYMENT_LOGOS.map((logo, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-white px-1 py-0.5 rounded border border-slate-200/50 shadow-sm flex items-center justify-center h-5 flex-shrink-0"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={logo.src} 
                                                    className="h-2 w-auto object-contain" 
                                                    alt={logo.name} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : hasManual ? (
                                <div className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 space-y-3.5 animate-in fade-in duration-300">
                                    <div className="space-y-1">
                                        <h5 className="font-bold text-slate-800 text-xs">Transfer Bank Rekening Toko</h5>
                                        <p className="text-[9px] text-slate-400 font-medium leading-tight">Lakukan transfer manual dan kirim bukti pembayaran.</p>
                                    </div>
                                    
                                    <div className="space-y-2 bg-white/80 p-3 rounded-lg border border-slate-200/60 shadow-sm">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-slate-400 text-[10px]">Bank</span>
                                            <span className="font-bold text-slate-800 text-[11px]">{paymentSettings.bankName}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-slate-400 text-[10px]">Nama Rekening</span>
                                            <span className="font-bold text-slate-800 text-[11px]">{paymentSettings.accountHolder}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-slate-400 text-[10px]">No. Rekening</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-black text-slate-800 tracking-tight text-xs">{paymentSettings.accountNumber}</span>
                                                <button
                                                    type="button"
                                                    onClick={copyToClipboard}
                                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 active:scale-90 transition-all flex items-center justify-center"
                                                >
                                                    {copied ? <Check size={8} className="text-emerald-600 font-bold" /> : <Copy size={8} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Checkbox persetujuan Syarat & Ketentuan serta Kebijakan Privasi */}
                    <div className="flex items-start gap-2.5 p-1 pt-2 border-t border-slate-100 mt-2 animate-in fade-in duration-200">
                        <input
                            id="express-accept-terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-350 text-[var(--brand-color)] focus:ring-[var(--brand-color)] transition-colors cursor-pointer"
                            style={{ 
                                "--brand-color": brandColor, 
                            } as React.CSSProperties}
                        />
                        <label htmlFor="express-accept-terms" className="text-[10px] text-slate-500 leading-relaxed cursor-pointer select-none font-normal">
                            Saya menyetujui{" "}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:underline hover:text-slate-900 transition-colors">
                                Syarat & Ketentuan
                            </a>{" "}
                            serta{" "}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:underline hover:text-slate-900 transition-colors">
                                Kebijakan Privasi
                            </a>{" "}
                            yang berlaku di website ini.
                        </label>
                    </div>

                    {/* Security message */}
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium leading-relaxed">
                        <Lock size={12} className="text-slate-400 shrink-0" />
                        <span>Koneksi aman terenkripsi SSL 256-bit. Informasi Anda 100% terjaga kerahasiaannya.</span>
                    </div>
                </form>

                {/* Footer with actions */}
                <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-4 flex-shrink-0 bg-slate-50/50">
                    <div className="text-left">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Pembayaran</span>
                        <span className="text-base font-black text-slate-800 tracking-tight mt-1 block" style={{ color: brandColor }}>
                            {formatPrice(activePrice, currency)}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !acceptedTerms}
                        className="px-6 py-3 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-md hover:opacity-95"
                        style={{
                            backgroundColor: brandColor,
                            boxShadow: `0 4px 14px -3px ${brandColor}40`
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={13} />
                                <span>Bayar Sekarang</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
