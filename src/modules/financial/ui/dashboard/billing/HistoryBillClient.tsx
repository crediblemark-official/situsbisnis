"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CreditCard, History } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TransactionHistory } from "@/modules/payment/ui/dashboard/billing/TransactionHistory";
import { PaymentConfirmation } from "@/modules/payment/ui/dashboard/billing/PaymentConfirmation";
import { Transaction } from "@/modules/subscription/ui/dashboard/billing/types";
import { confirmManualPaymentAction, cancelTransactionAction } from "@/modules/financial";

interface HistoryBillClientProps {
    transactions: Transaction[];
    paymentMethods: any[];
    whatsappNumber: string;
    siteId: string;
}

export default function HistoryBillClient({
    transactions,
    paymentMethods,
    whatsappNumber,
    siteId
}: HistoryBillClientProps) {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeTx, setActiveTx] = useState<any>(null);
    const [confirmData, setConfirmData] = useState({ notes: "", proofOfPayment: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/media", {
                method: "POST",
                headers: { "x-site-id": siteId },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setConfirmData({ ...confirmData, proofOfPayment: data.url });
            } else {
                alert("Upload gagal. Pastikan file adalah gambar dan berukuran < 10MB.");
            }
        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = async () => {
        if (!activeTx) return;
        setIsLoading(true);
        try {
            const res = await confirmManualPaymentAction({
                transactionId: activeTx.id,
                ...confirmData
            });
            if (res.success) {
                const cleanedPhone = whatsappNumber.replace(/[^0-9]/g, "");
                const planName = activeTx?.plan?.name || "Layanan/Slot";
                const amountStr = `Rp ${Number(activeTx.amount).toLocaleString("id-ID")}`;
                const txId = activeTx.id || "";
                const notesStr = confirmData.notes ? `\n- *Keterangan*: ${confirmData.notes}` : "";
                const proofStr = confirmData.proofOfPayment ? `\n- *Bukti Transfer*: ${confirmData.proofOfPayment}` : "";
                const message = `Halo Admin, saya ingin konfirmasi pembayaran manual:\n\n- *ID Transaksi*: ${txId}\n- *Nominal*: ${amountStr}\n- *Paket*: ${planName}${notesStr}${proofStr}\n\nMohon segera diverifikasi. Terima kasih!`;
                const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
                
                window.open(waUrl, "_blank");

                setShowConfirmModal(false);
                window.location.reload();
            } else {
                alert(res.error || "Gagal memproses konfirmasi pembayaran.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelTransaction = async (txId: string) => {
        setIsLoading(true);
        try {
            const res = await cancelTransactionAction({ transactionId: txId });
            if (res.success) {
                window.location.reload();
            } else {
                alert(res.error || "Gagal membatalkan transaksi.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6 text-foreground">
            <PageHeader
                title="Tagihan & Layanan"
                subtitle="Lihat semua riwayat transaksi pembayaran dan status tagihan Anda."
                icon={<CreditCard />}
            />

            {/* Premium Tab Navigation */}
            <div className="flex border-b border-border/60 pb-px">
                <Link
                    href="/dashboard/billing"
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border/80 transition-all duration-300 -mb-[1px] flex items-center gap-2 shrink-0"
                >
                    <CreditCard size={14} />
                    Paket & Layanan
                </Link>
                <Link
                    href="/dashboard/history-bill"
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 border-primary text-primary transition-all duration-300 -mb-[1px] flex items-center gap-2 shrink-0"
                >
                    <History size={14} />
                    Riwayat Pesanan
                </Link>
            </div>

            {showConfirmModal ? (
                <PaymentConfirmation
                    activeTx={activeTx}
                    paymentMethods={paymentMethods}
                    confirmData={confirmData}
                    setConfirmData={setConfirmData}
                    handleFileUpload={handleFileUpload}
                    handleConfirm={handleConfirm}
                    handleCopy={handleCopy}
                    copied={copied}
                    isLoading={isLoading}
                    isUploading={isUploading}
                    onCancel={() => setShowConfirmModal(false)}
                />
            ) : (
                <TransactionHistory
                    transactions={transactions}
                    onConfirm={(tx) => {
                        setActiveTx(tx);
                        setShowConfirmModal(true);
                    }}
                    onCancel={handleCancelTransaction}
                />
            )}
        </div>
    );
}
