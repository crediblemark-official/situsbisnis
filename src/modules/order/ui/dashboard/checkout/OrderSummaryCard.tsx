import React from "react";
import { Clock, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { TransactionData } from "./types";
import { formatRp } from "./utils";

interface OrderSummaryCardProps {
    transaction: TransactionData;
    customPaymentDetails: any;
    expired: boolean;
    h: number;
    m: number;
    s: number;
    copied: string | null;
    onCopy: (_text: string) => void;
    isPolling: boolean;
    onCheckStatus: () => void;
}

export function OrderSummaryCard({
    transaction,
    customPaymentDetails,
    expired,
    h,
    m,
    s,
    copied,
    onCopy,
    isPolling,
    onCheckStatus,
}: OrderSummaryCardProps) {
    const reference = transaction.paymentReference || customPaymentDetails?.reference;

    return (
        <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-20">
            {/* Countdown Timer */}
            <div className={`rounded-xl border p-3.5 flex items-center gap-4 ${
                expired
                    ? "bg-red-500/5 border-red-500/20 text-red-400"
                    : "bg-card border-border"
            }`}>
                <Clock size={20} className={expired ? "text-red-400" : "text-primary"} />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {expired ? "Sesi Kedaluwarsa" : "Sesi Berakhir Dalam"}
                    </p>
                    {expired ? (
                        <p className="text-sm font-black text-red-400">Silakan buat transaksi baru</p>
                    ) : (
                        <p className="text-xl font-mono font-black text-foreground tabular-nums">
                            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                        </p>
                    )}
                </div>
            </div>

            {/* Transaction Summary Card */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ringkasan Pesanan</p>
                    <h2 className="text-lg font-black text-foreground mt-1 leading-tight">
                        {transaction.plan ? `Paket ${transaction.plan.name.toUpperCase()}` : "Pembelian Layanan"}
                    </h2>
                    {transaction.site && (
                        <p className="text-xs text-muted-foreground mt-0.5">Situs: {transaction.site.name}</p>
                    )}
                </div>

                <div className="border-t border-border pt-4 space-y-2.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>ID Transaksi</span>
                        <button
                            type="button"
                            onClick={() => onCopy(transaction.id)}
                            className="flex items-center gap-1 font-mono text-foreground hover:text-primary transition-colors"
                        >
                            {transaction.id.slice(0, 12)}…
                            {copied === transaction.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                        </button>
                    </div>
                    {reference && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>No. Referensi</span>
                            <button
                                type="button"
                                onClick={() => onCopy(reference)}
                                className="flex items-center gap-1 font-mono text-foreground hover:text-primary transition-colors"
                            >
                                {reference}
                                {copied === reference ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex justify-between items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Bayar</span>
                    <span className="text-2xl font-black text-foreground tracking-tighter">
                        {formatRp(transaction.amount)}
                    </span>
                </div>
            </div>

            {/* Status polling indicator */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium px-1">
                {isPolling
                    ? <><Loader2 size={10} className="animate-spin text-primary" /> Memeriksa status...</>
                    : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Memantau pembayaran otomatis</>
                }
                <button
                    type="button"
                    onClick={onCheckStatus}
                    disabled={isPolling}
                    className="ml-auto text-primary hover:underline flex items-center gap-1"
                >
                    <RefreshCw size={10} className={isPolling ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>
        </div>
    );
}
