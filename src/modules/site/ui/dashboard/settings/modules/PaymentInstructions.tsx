"use client";

import React from "react";
import { FormSection } from "@/components/ui/Form";
import { CreditCard } from "lucide-react";

interface PaymentInstructionsProps {
    paymentData: any;
    onPaymentChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function PaymentInstructions({ paymentData, onPaymentChange }: PaymentInstructionsProps) {
    return (
        <FormSection title="Metode Pembayaran Toko" description="Aktifkan jenis pembayaran otomatis atau transfer manual pelanggan." icon={<CreditCard size={16} />}>
            <div className="space-y-6 p-2">
                {/* Switch / Checkbox Status Pembayaran */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/80 bg-muted/5 hover:bg-muted/10 cursor-pointer select-none transition-all">
                        <input 
                            id="gatewayEnabledInput"
                            type="checkbox" 
                            name="gatewayEnabled" 
                            checked={paymentData.gatewayEnabled} 
                            onChange={onPaymentChange} 
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-muted/10"
                        />
                        <label htmlFor="gatewayEnabledInput" className="cursor-pointer">
                            <span className="text-xs font-bold text-foreground block">Pembayaran Otomatis (Midtrans)</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">Pelanggan membayar instan melalui Virtual Account, QRIS, dll.</span>
                        </label>
                    </div>
 
                    <div className="flex items-center gap-3 p-4 rounded-xl border border-border/80 bg-muted/5 hover:bg-muted/10 cursor-pointer select-none transition-all">
                        <input 
                            id="manualEnabledInput"
                            type="checkbox" 
                            name="manualEnabled" 
                            checked={paymentData.manualEnabled} 
                            onChange={onPaymentChange} 
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-muted/10"
                        />
                        <label htmlFor="manualEnabledInput" className="cursor-pointer">
                            <span className="text-xs font-bold text-foreground block">Transfer Bank Manual</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">Pelanggan mentransfer secara manual ke rekening bank Anda.</span>
                        </label>
                    </div>
                </div>

                {/* Form Rekening Manual (hanya tampil jika manualEnabled aktif) */}
                {paymentData.manualEnabled && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-2">Informasi Rekening Transfer Manual</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="payment-bank-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nama Bank</label>
                                <input 
                                    id="payment-bank-name"
                                    type="text" 
                                    name="bankName" 
                                    value={paymentData.bankName} 
                                    onChange={onPaymentChange} 
                                    className="w-full bg-muted/10 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                    placeholder="cth. BCA, Mandiri..." 
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="payment-account-number" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nomor Rekening</label>
                                <input 
                                    id="payment-account-number"
                                    type="text" 
                                    name="accountNumber" 
                                    value={paymentData.accountNumber} 
                                    onChange={onPaymentChange} 
                                    className="w-full bg-muted/10 border border-border/50 rounded-xl px-4 py-3 text-xs font-mono font-black text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                    placeholder="000-000-000" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="payment-account-holder" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nama Pemilik</label>
                                <input 
                                    id="payment-account-holder"
                                    type="text" 
                                    name="accountHolder" 
                                    value={paymentData.accountHolder} 
                                    onChange={onPaymentChange} 
                                    className="w-full bg-muted/10 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                    placeholder="Nama sesuai buku tabungan" 
                                />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3 space-y-2">
                                <label htmlFor="payment-instructions" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Instruksi Tambahan</label>
                                <textarea 
                                    id="payment-instructions"
                                    name="instructions" 
                                    value={paymentData.instructions} 
                                    onChange={onPaymentChange} 
                                    rows={3}
                                    className="w-full bg-muted/10 border border-border/50 rounded-xl px-4 py-3 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all resize-none"
                                    placeholder="Contoh: Kirim bukti transfer ke WA kami setelah melakukan pembayaran." 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </FormSection>
    );
}
