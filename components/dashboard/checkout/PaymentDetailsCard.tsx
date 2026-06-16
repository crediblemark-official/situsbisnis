import React from "react";
import { AlertCircle, Check, Copy } from "lucide-react";
import { getCategoryLabel, getPaymentInstructions } from "./utils";

interface PaymentDetailsCardProps {
    customPaymentDetails: any;
    copied: string | null;
    onCopy: (_text: string) => void;
    onResetPayment: () => void;
}

export function PaymentDetailsCard({
    customPaymentDetails,
    copied,
    onCopy,
    onResetPayment,
}: PaymentDetailsCardProps) {
    const payCode = customPaymentDetails?.vaNumber || customPaymentDetails?.paymentCode || customPaymentDetails?.qrString;
    const isQris = !!(customPaymentDetails?.qrString || customPaymentDetails?.qrCodeUrl || (customPaymentDetails?.paymentMethod && getCategoryLabel(customPaymentDetails.paymentMethod) === "QRIS"));
    const paymentInstructions = getPaymentInstructions(customPaymentDetails.paymentMethod, payCode || "", isQris);
    const qrCodeImageUrl = (customPaymentDetails?.qrString
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customPaymentDetails.qrString)}`
        : customPaymentDetails?.qrCodeUrl) || null;

    return (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded uppercase tracking-wider">
                        {getCategoryLabel(customPaymentDetails.paymentMethod)}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-2">Instruksi Pembayaran Kustom</h3>
                </div>
                <button
                    type="button"
                    onClick={onResetPayment}
                    className="text-xs text-destructive hover:text-destructive/80 hover:underline font-semibold flex items-center gap-1 transition-colors"
                >
                    Ganti Metode
                </button>
            </div>

            {/* Main Payment Code / QRIS Card */}
            {isQris ? (
                <div className="flex flex-col items-center justify-center p-4 bg-muted/20 border border-border rounded-xl space-y-3">
                    {qrCodeImageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            src={qrCodeImageUrl}
                            alt="QRIS QR Code"
                            className="w-48 h-48 object-contain rounded-md border bg-white p-2 shadow-sm"
                        />
                    ) : (
                        <div className="w-52 h-52 flex items-center justify-center bg-white border rounded-lg text-xs text-muted-foreground">
                            Memuat QR Code...
                        </div>
                    )}
                    <div className="text-center">
                        <p className="text-xs font-bold text-foreground">Scan QRIS untuk Membayar</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Kompatibel dengan semua e-wallet & mobile banking</p>
                    </div>
                </div>
            ) : (
                <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        {getCategoryLabel(customPaymentDetails.paymentMethod) === "Virtual Account" ? "Nomor Virtual Account" : "Kode Pembayaran"}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-black text-foreground tracking-wider">
                            {payCode}
                        </span>
                        <button
                            type="button"
                            onClick={() => onCopy(payCode || "")}
                            className="p-1.5 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Salin Kode"
                        >
                            {copied === payCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Instructions */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Langkah-Langkah Pembayaran</h4>
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-muted-foreground leading-relaxed pl-1">
                    {paymentInstructions.map((step, idx) => (
                        <li key={idx} className="marker:font-semibold pl-1">
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3.5 flex gap-2.5 items-start text-xs text-amber-500">
                <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                <div>
                    <p className="font-bold">Menunggu Pembayaran</p>
                    <p className="text-[11px] text-amber-500/80 mt-0.5">Sistem memantau pembayaran Anda secara otomatis. Halaman akan dialihkan saat transaksi terverifikasi.</p>
                </div>
            </div>
        </div>
    );
}
