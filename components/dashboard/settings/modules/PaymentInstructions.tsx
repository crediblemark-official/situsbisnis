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
        <FormSection title="Instruksi Pembayaran Manual" description="Konfigurasi rekening untuk transfer manual pelanggan." icon={<CreditCard size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
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

        </FormSection>
    );
}
