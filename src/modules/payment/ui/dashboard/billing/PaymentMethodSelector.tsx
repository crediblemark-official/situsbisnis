import React, { useState, useEffect } from "react";
import { ArrowLeft, Landmark, CreditCard, Zap, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Plan } from "@/modules/subscription/ui/dashboard/billing/types";

interface PaymentMethodSelectorProps {
    selection: { type: "upgrade" | "buy_slot"; data?: any };
    billingCycle: "monthly" | "yearly";
    previewPlan: Plan | null;
    appliedCoupon: any;
    isLoading: boolean;
    paymentGateway?: string;
    onCancel: () => void;
    onProceed: (_method: "manual" | "duitku" | "midtrans") => void;
}

export function PaymentMethodSelector({
    selection,
    billingCycle,
    previewPlan,
    appliedCoupon,
    isLoading,
    paymentGateway = "duitku",
    onCancel,
    onProceed
}: PaymentMethodSelectorProps) {
    const [selectedMethod, setSelectedMethod] = useState<"duitku" | "midtrans" | "manual">(
        paymentGateway === "midtrans" ? "midtrans" : "duitku"
    );

    useEffect(() => {
        setSelectedMethod(paymentGateway === "midtrans" ? "midtrans" : "duitku");
    }, [paymentGateway]);

    // 1. Calculate Base Price
    let basePrice = 0;
    let title = "";
    let description = "";

    if (selection.type === "upgrade") {
        basePrice = Number(
            billingCycle === "yearly"
                ? (previewPlan?.priceYearly || Number(previewPlan?.price || 0) * 12)
                : (previewPlan?.price || 0)
        );
        title = `Peningkatan Paket: ${previewPlan?.name?.toUpperCase()}`;
        description = previewPlan?.description || "Peningkatan ke fitur premium platform.";
    } else {
        const qty = selection.data?.quantity || 1;
        basePrice = qty * 50000; // Harga satuan slot
        title = `Pembelian Slot: +${qty} Tambahan Situs`;
        description = "Membeli slot tambahan untuk membuat lebih banyak situs tanpa perlu upgrade paket utama.";
    }

    // 2. Apply Coupon if any
    let discountAmount = 0;
    if (appliedCoupon && selection.type === "upgrade") {
        if (appliedCoupon.discountType === "percentage") {
            discountAmount = basePrice * (appliedCoupon.discountValue / 100);
        } else {
            discountAmount = appliedCoupon.discountValue;
        }
    }
    const finalAmount = Math.max(0, basePrice - discountAmount);

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 text-foreground">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Kembali ke Tagihan
                </button>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    Metode Pembayaran
                </div>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Side: Summary Card */}
                <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-5">
                    <div className="space-y-1 pb-3 border-b border-border">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ringkasan Pesanan</h4>
                        <h3 className="text-lg font-black text-foreground tracking-tight leading-snug">{title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Subtotal</span>
                            <span className="text-foreground font-bold">Rp {basePrice.toLocaleString("id-ID")}</span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between text-xs font-medium text-emerald-500 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                <span>Kupon Promo ({appliedCoupon.code})</span>
                                <span className="font-bold">- Rp {discountAmount.toLocaleString("id-ID")}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Siklus Tagihan</span>
                            <span className="text-foreground font-black uppercase tracking-wider bg-muted/50 px-2 py-0.5 rounded text-[9px]">
                                {billingCycle === "yearly" ? "Tahunan" : "Bulanan"}
                            </span>
                        </div>

                        <div className="pt-3 border-t border-border flex justify-between items-center">
                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Total Bayar</span>
                            <span className="text-xl font-black text-foreground tracking-tighter">
                                Rp {finalAmount.toLocaleString("id-ID")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Selector */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Pilih Metode Pembayaran</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Silakan tentukan metode pembayaran yang Anda inginkan:</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            
                            {/* Option 1: Duitku / Midtrans Gateway */}
                            <div 
                                onClick={() => setSelectedMethod(paymentGateway === "midtrans" ? "midtrans" : "duitku")}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer flex gap-4 items-start relative overflow-hidden group ${
                                    selectedMethod !== "manual" 
                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                                        : "border-border hover:border-border-hover bg-muted/10"
                                }`}
                            >
                                <div className={`p-2.5 rounded-lg border shrink-0 transition-colors ${
                                    selectedMethod !== "manual" 
                                        ? "bg-primary text-primary-foreground border-primary/20" 
                                        : "bg-background text-muted-foreground border-border"
                                }`}>
                                    <CreditCard size={20} />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[11px] font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                            Pembayaran Instan & Otomatis
                                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[7px] font-black rounded-full uppercase tracking-wider">
                                                Instan
                                            </span>
                                        </h5>
                                        {selectedMethod !== "manual" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        Bayar menggunakan Virtual Account (BCA, Mandiri, BNI, dll), QRIS, atau Kartu Kredit melalui payment gateway **{paymentGateway === "midtrans" ? "Midtrans" : "Duitku"}**.
                                    </p>
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded w-fit">
                                        <Zap size={10} className="animate-pulse" /> Paket langsung aktif secara otomatis dalam hitungan detik!
                                    </p>
                                </div>
                            </div>

                            {/* Option 2: Manual Bank Transfer */}
                            <div 
                                onClick={() => setSelectedMethod("manual")}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer flex gap-4 items-start relative overflow-hidden group ${
                                    selectedMethod === "manual" 
                                        ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                                        : "border-border hover:border-border-hover bg-muted/10"
                                }`}
                            >
                                <div className={`p-2.5 rounded-lg border shrink-0 transition-colors ${
                                    selectedMethod === "manual" 
                                        ? "bg-primary text-primary-foreground border-primary/20" 
                                        : "bg-background text-muted-foreground border-border"
                                }`}>
                                    <Landmark size={20} />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-[11px] font-black text-foreground uppercase tracking-wider">
                                            Transfer Bank Manual
                                        </h5>
                                        {selectedMethod === "manual" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        Transfer manual ke rekening resmi Bank OCBC kami. Anda perlu mengunggah foto bukti transfer secara manual pada tab Riwayat Pesanan Anda.
                                    </p>
                                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 mt-1 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded w-fit">
                                        Memerlukan verifikasi admin (maks. 1x24 jam).
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Proceed Action Button */}
                        <div className="pt-4 border-t border-border">
                            <button
                                onClick={() => onProceed(selectedMethod)}
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Memproses Pembayaran...
                                    </>
                                ) : (
                                    <>
                                        Konfirmasi & Lanjutkan Pembayaran
                                        <ArrowRight size={12} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
