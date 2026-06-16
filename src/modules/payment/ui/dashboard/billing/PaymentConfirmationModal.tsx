import React from "react";
import Image from "next/image";
import { AlertCircle, Zap, Copy, CheckCircle2, Loader2, Upload, X, MessageCircle } from "lucide-react";
import { PaymentMethod, Transaction } from "@/modules/subscription/ui/dashboard/billing/types";

interface PaymentConfirmationModalProps {
    show: boolean;
    onClose: () => void;
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
}

export function PaymentConfirmationModal({
    show,
    onClose,
    activeTx,
    paymentMethods,
    confirmData,
    setConfirmData,
    handleFileUpload,
    handleConfirm,
    handleCopy,
    copied,
    isLoading,
    isUploading
}: PaymentConfirmationModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Pembayaran</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <AlertCircle size={18} />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    {/* Coming Soon Alert */}
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-400 shrink-0" />
                            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Sistem Pembayaran Otomatis</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-[8px] text-amber-400/80 font-bold uppercase tracking-widest italic">Sistem pembayaran otomatis sedang dalam tahap verifikasi</p>
                            <span className="px-1.5 py-0.5 bg-amber-400 text-black text-[7px] font-black uppercase rounded-full shadow-sm">Segera Hadir</span>
                        </div>
                    </div>

                    {/* Total Amount to Pay */}
                    {activeTx && (
                        <div className="p-5 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between shadow-inner">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Total Nominal Transfer</p>
                                <h4 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
                                    Rp {Number(activeTx.amount).toLocaleString()}
                                </h4>
                            </div>
                            <div className="text-right hidden sm:block">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status Tagihan</p>
                                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded-full border border-amber-500/20">
                                    Menunggu Pembayaran
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Pilih Rekening Tujuan:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {paymentMethods.map((pm) => (
                                <div key={pm.id} className="p-3 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tight">{pm.bankName}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-base font-black text-sky-500 font-mono tracking-tighter">{pm.accountNumber}</p>
                                            <button
                                                onClick={() => handleCopy(pm.accountNumber)}
                                                className={`p-1 rounded-md transition-all ${copied === pm.accountNumber ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-sky-500 hover:bg-primary/30'}`}
                                            >
                                                {copied === pm.accountNumber ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[7px] text-muted-foreground font-black uppercase tracking-widest">Penerima</p>
                                        <p className="text-[9px] font-black text-foreground uppercase tracking-tight truncate max-w-[100px]">{pm.accountHolder}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div className="space-y-1.5">
                            <label htmlFor="billing-notes" className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Keterangan (Opsional)</label>
                            <textarea
                                id="billing-notes"
                                className="w-full h-[90px] bg-muted/30 border border-border/50 rounded-xl p-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:text-muted-foreground/40 resize-none"
                                placeholder="Contoh: Sudah transfer via BCA Mobile"
                                value={confirmData.notes}
                                onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="billing-proof" className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Bukti Transfer (Upload Gambar)</label>
                        
                            {!confirmData.proofOfPayment ? (
                                <div className="relative group h-[90px]">
                                    <input
                                        id="billing-proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`w-full h-full border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all ${isUploading ? 'bg-muted/20 animate-pulse' : 'bg-muted/10 group-hover:bg-muted/20 group-hover:border-primary/30'}`}>
                                        {isUploading ? (
                                            <Loader2 size={18} className="text-sky-500 animate-spin" />
                                        ) : (
                                            <Upload size={18} className="text-muted-foreground group-hover:text-sky-500 transition-colors" />
                                        )}
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-foreground uppercase tracking-widest">
                                                {isUploading ? 'Mengunggah...' : 'Unggah Bukti'}
                                            </p>
                                            <p className="text-[7px] text-muted-foreground font-medium uppercase tracking-widest">PNG/JPG (Maks. 10MB)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative group h-[90px] p-2 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border/50 shrink-0 relative">
                                        <Image src={confirmData.proofOfPayment} alt="Bukti Transfer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-foreground uppercase tracking-widest truncate">Unggah Berhasil</p>
                                        <p className="text-[8px] text-sky-500 font-bold uppercase tracking-widest mt-0.5">Siap dikirim</p>
                                    </div>
                                    <button
                                        onClick={() => setConfirmData({ ...confirmData, proofOfPayment: "" })}
                                        className="p-1.5 bg-rose-500/20 text-rose-400 rounded-md hover:bg-rose-500/30 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center bg-sky-500/10 border border-sky-500/20 rounded-xl p-2.5 flex items-center gap-2.5 justify-center">
                        <MessageCircle size={14} className="text-sky-500 shrink-0 animate-pulse" />
                        <p className="text-[8px] sm:text-[9px] font-black text-sky-500 uppercase tracking-widest leading-none">
                            Konfirmasi akan disimpan di sistem & dilanjutkan ke WhatsApp untuk verifikasi instan.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading || isUploading}
                            className="flex-[2] bg-sky-500 hover:bg-sky-600 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-sky-500/20 hover:opacity-90 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <MessageCircle size={14} />
                                    Kirim Konfirmasi
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-muted/40 text-muted-foreground py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-muted/60 hover:text-foreground border border-border/50 transition-all active:scale-[0.98]"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
