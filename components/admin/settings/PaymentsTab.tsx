import React from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface PaymentsTabProps {
    paymentMethods: any[];
    addPaymentMethod: () => void;
    removePaymentMethod: (_id: string) => void;
    updatePaymentMethod: (_id: string, _field: string, _value: any) => void;
    duitkuMerchantCode?: string;
    duitkuApiKey?: string;
    duitkuSandbox?: boolean;
    onChangeDuitku?: (_field: string, _value: any) => void;
}

export function PaymentsTab({
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    updatePaymentMethod,
    duitkuMerchantCode,
    duitkuApiKey,
    duitkuSandbox,
    onChangeDuitku
}: PaymentsTabProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <CreditCard size={16} className="text-primary" />
                        Metode Pembayaran
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                        Kelola rekening transfer manual untuk pembayaran pelanggan.
                    </p>
                </div>
                <button
                    onClick={addPaymentMethod}
                    disabled={paymentMethods.length >= 1}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                    <Plus size={14} /> Tambah Rekening
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((pm) => (
                    <div key={pm.id} className="bg-card border border-border rounded-md shadow-2xl overflow-hidden group">
                        <div className="px-6 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">{pm.bankName || "Bank Tidak Diketahui"}</h4>
                            <button
                                onClick={() => removePaymentMethod(pm.id)}
                                className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label htmlFor={`bank-name-${pm.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nama Bank / Layanan</label>
                                <input
                                    id={`bank-name-${pm.id}`}
                                    type="text"
                                    value={pm.bankName || ""}
                                    onChange={(e) => updatePaymentMethod(pm.id, "bankName", e.target.value)}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                    placeholder="BCA, Mandiri, PayPal..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor={`account-number-${pm.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nomor Rekening / ID Akun</label>
                                <input
                                    id={`account-number-${pm.id}`}
                                    type="text"
                                    value={pm.accountNumber || ""}
                                    onChange={(e) => updatePaymentMethod(pm.id, "accountNumber", e.target.value)}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none font-mono"
                                    placeholder="0000-0000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor={`account-holder-${pm.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nama Pemilik Rekening</label>
                                <input
                                    id={`account-holder-${pm.id}`}
                                    type="text"
                                    value={pm.accountHolder || ""}
                                    onChange={(e) => updatePaymentMethod(pm.id, "accountHolder", e.target.value)}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Duitku Automatic Payment Gateway */}
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden mt-6">
                <div className="px-6 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Duitku Gateway (Otomatis)</h4>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                        Kredensial pembayaran otomatis Duitku untuk langganan dan upgrade plan platform.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="duitkuMerchantCode" className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Merchant Code</label>
                            <input
                                id="duitkuMerchantCode"
                                type="text"
                                value={duitkuMerchantCode || ""}
                                onChange={(e) => onChangeDuitku && onChangeDuitku("duitkuMerchantCode", e.target.value)}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                placeholder="DXXXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="duitkuApiKey" className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">API Key (Merchant Key)</label>
                            <input
                                id="duitkuApiKey"
                                type="password"
                                value={duitkuApiKey || ""}
                                onChange={(e) => onChangeDuitku && onChangeDuitku("duitkuApiKey", e.target.value)}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none font-mono"
                                placeholder="Masukkan API Key Duitku..."
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            id="duitkuSandbox"
                            type="checkbox"
                            checked={duitkuSandbox ?? true}
                            onChange={(e) => onChangeDuitku && onChangeDuitku("duitkuSandbox", e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-muted/10"
                        />
                        <label htmlFor="duitkuSandbox" className="text-[9px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none">
                            Gunakan Mode Sandbox (Development)
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
