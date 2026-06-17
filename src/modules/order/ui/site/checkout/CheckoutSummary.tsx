import React from "react";
import Image from "next/image";
import { ShoppingCart, ChevronDown, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

interface CheckoutSummaryProps {
    items: any[];
    cartTotal: number;
    formatPrice: (_price: number) => string;
    brandColor: string;
    isSummaryExpanded?: boolean;
    setIsSummaryExpanded?: (_expanded: boolean) => void;
    checkoutMethod: "system" | "whatsapp";
    isProcessing: boolean;
    mode?: "mobile-top" | "mobile-bottom" | "desktop";
}

export function CheckoutSummary({
    items,
    cartTotal,
    formatPrice,
    brandColor,
    isSummaryExpanded = false,
    setIsSummaryExpanded,
    checkoutMethod,
    isProcessing,
    mode = "desktop",
}: CheckoutSummaryProps) {
    if (mode === "mobile-top") {
        return (
            /* Mobile-first Collapsible Order Summary (visible only on mobile lg:hidden) */
            <div className="lg:hidden bg-white border border-slate-200/80 rounded-lg p-3.5 mb-5 shadow-sm animate-in fade-in duration-350">
                <button 
                    type="button" 
                    onClick={() => setIsSummaryExpanded && setIsSummaryExpanded(!isSummaryExpanded)} 
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 outline-none"
                >
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={15} style={{ color: brandColor }} />
                        <span>{isSummaryExpanded ? "Sembunyikan Ringkasan" : "Tampilkan Ringkasan Pesanan"}</span>
                        <ChevronDown size={14} className={`transform transition-transform ${isSummaryExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: brandColor }}>{formatPrice(cartTotal)}</span>
                </button>
                
                {isSummaryExpanded && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-1 duration-200">
                        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.variantName || 'base'}`} className="flex gap-3 items-center">
                                    <div className="w-11 h-11 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 relative">
                                        {item.image ? (
                                            <Image src={item.image} alt={item.name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover" unoptimized />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-800 text-xs truncate">{item.name}</h4>
                                        {item.variantName && (
                                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.variantName}</p>
                                        )}
                                        <p className="text-[11px] text-slate-500 font-normal mt-0.5">{item.quantity} x {formatPrice(item.price)}</p>
                                    </div>
                                    <span className="font-semibold text-slate-800 text-xs">{formatPrice(item.price * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500 font-medium">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="text-slate-800 font-semibold">{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pengiriman</span>
                                <span className="text-emerald-700 font-semibold">Gratis</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (mode === "mobile-bottom") {
        return (
            /* Mobile-first CTA Summary card (rendered at bottom of screen on mobile only) */
            <div className="lg:hidden bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm mt-6 animate-in fade-in duration-350">
                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Subtotal</span>
                        <span className="text-slate-800 font-semibold">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Pengiriman</span>
                        <span className="text-emerald-700 font-semibold">Gratis</span>
                    </div>
                    <div className="flex justify-between items-end pt-3.5 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-medium text-slate-500">Total Bayar</span>
                            <div className="text-xl font-bold tracking-tight mt-0.5" style={{ color: brandColor }}>
                                {formatPrice(cartTotal)}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    form="checkout-form"
                    type="submit"
                    disabled={isProcessing}
                    className="w-full mt-5 py-3 text-white rounded-lg font-semibold text-xs tracking-wider transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group outline-none"
                    style={{ 
                        backgroundColor: checkoutMethod === "whatsapp" ? "#22c55e" : brandColor,
                        boxShadow: `0 4px 14px -3px ${checkoutMethod === "whatsapp" ? "rgba(34, 197, 94, 0.4)" : `${brandColor}40`}`
                    }}
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin mr-2" size={14} />
                    ) : checkoutMethod === "whatsapp" ? (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current mr-2" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    ) : (
                        <ArrowRight className="mr-1.5 group-hover:translate-x-0.5 transition-transform" size={13} />
                    )}
                    {isProcessing ? "Memproses..." : checkoutMethod === "whatsapp" ? "Kirim Pesanan ke WhatsApp" : "Konfirmasi Pesanan"}
                </button>

                <p className="text-center text-[10px] text-slate-500 mt-4 flex items-center justify-center font-medium gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" /> Transaksi Terenkripsi & Aman
                </p>
            </div>
        );
    }

    return (
        /* Desktop Sticky Order Summary Column (Sticky Desktop, standard card layout) */
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-6 animate-in fade-in duration-350">
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                {/* Header */}
                <h2 className="flex text-sm font-bold text-slate-800 tracking-tight mb-5 items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <ShoppingCart size={15} />
                    </div>
                    Ringkasan Pesanan
                </h2>
                
                {/* Item List */}
                <div className="space-y-3.5 mb-5 max-h-[32vh] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => (
                        <div key={`${item.productId}-${item.variantName || 'base'}`} className="flex gap-3 items-center group">
                            <div className="w-11 h-11 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 relative shadow-sm group-hover:scale-105 transition-transform">
                                {item.image ? (
                                    <Image src={item.image} alt={item.name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full bg-slate-200" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-800 text-xs truncate group-hover:text-primary transition-colors">{item.name}</h4>
                                {item.variantName && (
                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.variantName}</p>
                                )}
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">{item.quantity} x {formatPrice(item.price)}</p>
                            </div>
                            <span className="font-semibold text-slate-800 text-xs">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Subtotal</span>
                        <span className="text-slate-800 font-semibold">{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Pengiriman</span>
                        <span className="text-emerald-700 font-semibold">Gratis</span>
                    </div>
                    <div className="flex justify-between items-end pt-3.5 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-medium text-slate-500">Total Bayar</span>
                            <div className="text-xl font-bold tracking-tight mt-0.5" style={{ color: brandColor }}>
                                {formatPrice(cartTotal)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action CTA Button */}
                <button
                    form="checkout-form"
                    type="submit"
                    disabled={isProcessing}
                    className="w-full mt-5 py-3 text-white rounded-lg font-semibold text-xs tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group outline-none"
                    style={{ 
                        backgroundColor: checkoutMethod === "whatsapp" ? "#22c55e" : brandColor,
                        boxShadow: `0 4px 14px -3px ${checkoutMethod === "whatsapp" ? "rgba(34, 197, 94, 0.4)" : `${brandColor}40`}`
                    }}
                >
                    {isProcessing ? (
                        <Loader2 className="animate-spin mr-2" size={14} />
                    ) : checkoutMethod === "whatsapp" ? (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current mr-2" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    ) : (
                        <ArrowRight className="mr-1.5 group-hover:translate-x-0.5 transition-transform" size={13} />
                    )}
                    {isProcessing ? "Memproses..." : checkoutMethod === "whatsapp" ? "Kirim Pesanan ke WhatsApp" : "Konfirmasi Pesanan"}
                </button>
                
                <p className="text-center text-[10px] text-slate-500 mt-4 flex items-center justify-center font-medium gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" /> Transaksi Terenkripsi & Aman
                </p>
            </div>
        </div>
    );
}
