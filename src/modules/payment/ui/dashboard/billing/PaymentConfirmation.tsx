import React from "react";
import Image from "next/image";
import { Zap, Copy, CheckCircle2, Loader2, Upload, X, MessageCircle, ArrowLeft, Landmark } from "lucide-react";
import { PaymentMethod, Transaction } from "@/modules/subscription/ui/dashboard/billing/types";

interface PaymentConfirmationProps {
    activeTx: Transaction | null;
    paymentMethods: PaymentMethod[];
    confirmData: { notes: string; proofOfPayment: string };
    setConfirmData: (_data: any) => void;
    handleFileUpload: (_e: React.ChangeEvent<HTMLInputElement>) => void;
    handleConfirm: () => void;
    handleCopy: (_text: string) => void;
    copied: string | null;
    isLoading: boolean;
    isUploading: boolean;
    onCancel: () => void;
}

export function PaymentConfirmation({
    activeTx,
    paymentMethods,
    confirmData,
    setConfirmData,
    handleFileUpload,
    handleConfirm,
    handleCopy,
    copied,
    isLoading,
    isUploading,
    onCancel
}: PaymentConfirmationProps) {
    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header / Back Link */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={onCancel}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest group cursor-pointer"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Kembali ke Tagihan
                </button>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Secure Checkout
                </div>
            </div>

            {/* Main Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Billing Details & Destination Accounts */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Invoice Info Card */}
                    <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Transaksi Aktif</p>
                                <h3 className="text-md font-black text-foreground tracking-tight leading-snug">
                                    {activeTx?.plan?.name ? `Peningkatan Paket ${activeTx.plan.name}` : "Pembelian Slot Situs Tambahan"}
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded-full border border-amber-500/20 tracking-wider">
                                Pending
                            </span>
                        </div>

                        {/* Amount Display */}
                        {activeTx && (
                            <div className="p-4 bg-muted/40 border border-border/50 rounded-lg flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Total Tagihan</p>
                                    <h4 className="text-2xl font-black text-foreground tracking-tighter">
                                        Rp {Number(activeTx.amount).toLocaleString("id-ID")}
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Metode</p>
                                    <span className="text-[9px] font-bold text-foreground flex items-center gap-1.5 justify-end">
                                        <Landmark size={12} className="text-primary" /> Transfer Manual
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Info Alert Banner */}
                        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg flex gap-3">
                            <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pembayaran Instan Segera Hadir</p>
                                <p className="text-[9px] text-muted-foreground/80 font-medium leading-relaxed">
                                    Gerbang pembayaran otomatis kami sedang dalam tahap verifikasi akhir. Untuk saat ini, silakan selesaikan pembayaran melalui transfer manual ke rekening tujuan di bawah ini.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Destination Accounts Card */}
                    <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-3">
                        <div>
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Rekening Tujuan Transfer</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Silakan transfer nominal tagihan di atas ke salah satu rekening resmi kami:</p>
                        </div>

                        <div className="space-y-2">
                            {paymentMethods.map((pm) => (
                                <div 
                                    key={pm.id} 
                                    className="p-3 bg-muted/20 border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-primary/30 hover:bg-muted/30 transition-all duration-300"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </span>
                                            <p className="text-[9px] font-black text-foreground uppercase tracking-widest">{pm.bankName}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-black text-primary font-mono tracking-tighter">{pm.accountNumber}</p>
                                            <button
                                                onClick={() => handleCopy(pm.accountNumber)}
                                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                                    copied === pm.accountNumber 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                                        : 'bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10'
                                                }`}
                                                title="Salin Nomor Rekening"
                                            >
                                                {copied === pm.accountNumber ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="sm:text-right shrink-0">
                                        <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">Nama Penerima</p>
                                        <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{pm.accountHolder}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Dynamic Form Confirmation */}
                <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm space-y-5">
                    <div className="space-y-1 border-b border-border pb-3">
                        <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Konfirmasi Pembayaran</h4>
                        <p className="text-xs text-muted-foreground">Isi formulir untuk mengajukan bukti transfer Anda.</p>
                    </div>

                    <div className="space-y-4">
                        
                        {/* File Upload Box */}
                        <div className="space-y-1.5">
                            <label htmlFor="billing-proof" className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">
                                Bukti Transfer <span className="text-rose-500">*</span>
                            </label>
                        
                            {!confirmData.proofOfPayment ? (
                                <div className="relative group h-[95px] rounded-lg overflow-hidden border border-dashed border-border hover:border-primary/40 transition-colors duration-300">
                                    <input
                                        id="billing-proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 p-3 transition-all duration-300 ${
                                        isUploading ? 'bg-muted/10 animate-pulse' : 'bg-muted/5 group-hover:bg-muted/10'
                                    }`}>
                                        {isUploading ? (
                                            <Loader2 size={18} className="text-primary animate-spin" />
                                        ) : (
                                            <Upload size={18} className="text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                        )}
                                        <div className="text-center space-y-0.5">
                                            <p className="text-[9px] font-black text-foreground uppercase tracking-widest">
                                                {isUploading ? 'Mengunggah...' : 'Unggah Bukti Pembayaran'}
                                            </p>
                                            <p className="text-[7px] text-muted-foreground font-medium uppercase tracking-widest">Format PNG/JPG (Maks. 10MB)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between gap-3 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-11 h-11 rounded overflow-hidden bg-muted border border-border/50 shrink-0 relative">
                                            <Image 
                                                src={confirmData.proofOfPayment} 
                                                alt="Bukti Transfer" 
                                                sizes="44px" 
                                                fill 
                                                className="object-cover" 
                                                unoptimized 
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-foreground uppercase tracking-widest truncate">Unggah Berhasil</p>
                                            <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Gambar terlampir
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfirmData({ ...confirmData, proofOfPayment: "" })}
                                        className="p-1.5 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20 transition-all cursor-pointer"
                                        title="Hapus Bukti"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Optional Notes */}
                        <div className="space-y-1.5">
                            <label htmlFor="billing-notes" className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">
                                Keterangan Tambahan (Opsional)
                            </label>
                            <textarea
                                id="billing-notes"
                                className="w-full h-[75px] bg-muted/10 border border-border hover:border-border-hover rounded-lg p-2.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground/30 resize-none"
                                placeholder="Contoh: Sudah transfer dari Bank BCA a/n Budi"
                                value={confirmData.notes}
                                onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Meta Action Box */}
                    <div className="space-y-3 pt-3 border-t border-border">
                        <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-2.5 flex gap-2 items-start">
                            <MessageCircle size={12} className="text-sky-500 shrink-0 mt-0.5" />
                            <p className="text-[8px] font-bold text-sky-500/90 leading-relaxed uppercase tracking-wider">
                                Pembayaran diproses max 1x24 jam. Setelah menekan tombol kirim, Anda akan diteruskan ke WhatsApp Admin untuk validasi prioritas.
                            </p>
                        </div>

                        {/* Buttons Stack */}
                        <div className="space-y-1.5">
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading || isUploading || !confirmData.proofOfPayment}
                                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-2.5 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle size={12} />
                                        Kirim & Hubungi Admin
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onCancel}
                                className="w-full bg-muted/20 text-muted-foreground py-2.5 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] hover:bg-muted/40 hover:text-foreground border border-border transition-all active:scale-[0.98] cursor-pointer"
                            >
                                Batalkan Pengajuan
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
