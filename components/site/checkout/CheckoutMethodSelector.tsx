import React from "react";
import { ShieldCheck } from "lucide-react";

interface CheckoutMethodSelectorProps {
    brandColor: string;
    checkoutMethod: "system" | "whatsapp";
    setCheckoutMethod: (_method: "system" | "whatsapp") => void;
}

export function CheckoutMethodSelector({
    brandColor,
    checkoutMethod,
    setCheckoutMethod,
}: CheckoutMethodSelectorProps) {
    return (
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Pilih Metode Transaksi</h3>
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setCheckoutMethod("system")}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                        checkoutMethod === "system"
                            ? "bg-primary/[0.02] -translate-y-[1px] shadow-sm"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 text-slate-500 hover:border-slate-200"
                    }`}
                    style={{ 
                        borderColor: checkoutMethod === "system" ? brandColor : undefined,
                    }}
                >
                    <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            checkoutMethod === "system" ? "text-white shadow-sm" : "bg-slate-200 text-slate-600"
                        }`}
                        style={{ backgroundColor: checkoutMethod === "system" ? brandColor : undefined }}
                    >
                        <ShieldCheck size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Sistem Pesanan</span>
                    <span className="text-[10px] text-slate-500 text-center font-normal leading-normal">Transfer Bank & Catat Pesanan</span>
                </button>

                <button
                    type="button"
                    onClick={() => setCheckoutMethod("whatsapp")}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                        checkoutMethod === "whatsapp"
                            ? "border-emerald-500 bg-emerald-500/[0.02] -translate-y-[1px] shadow-sm"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 text-slate-500 hover:border-slate-200"
                    }`}
                >
                    <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            checkoutMethod === "whatsapp" ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-200 text-slate-600"
                        }`}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold text-slate-800">Transaksi via WhatsApp</span>
                    <span className="text-[10px] text-slate-500 text-center font-normal leading-normal">Kirim Pesanan ke WhatsApp</span>
                </button>
            </div>
        </div>
    );
}
