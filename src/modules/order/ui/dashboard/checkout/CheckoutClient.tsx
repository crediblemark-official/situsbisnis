"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    AlertCircle,
} from "lucide-react";
import { CheckoutClientProps, PaymentMethod } from "./types";
import { useCountdown, formatRp } from "./utils";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { PaymentDetailsCard } from "./PaymentDetailsCard";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { 
    getPaymentMethodsAction, 
    checkTransactionStatusAction, 
    initializeCheckoutPaymentAction 
} from "@/modules/financial";

export function CheckoutClient({ transaction, platformName: _platformName, isDuitkuConfigured }: CheckoutClientProps) {
    const router = useRouter();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isLoadingMethods, setIsLoadingMethods] = useState(false);
    const [methodsError, setMethodsError] = useState<string | null>(null);
    const [status, setStatus] = useState(transaction.status);
    const [isPolling, setIsPolling] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isProceeding, setIsProceeding] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>("Virtual Account");
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { h, m, s, expired } = useCountdown(transaction.createdAt);

    const [customPaymentDetails, setCustomPaymentDetails] = useState<any>(() => {
        if (transaction.paymentUrl && transaction.paymentUrl.startsWith("custom:")) {
            try {
                return JSON.parse(transaction.paymentUrl.substring(7));
            } catch {
                return null;
            }
        }
        return null;
    });

    // ── Fetch payment methods ─────────────────────────────────────────────────
    const fetchPaymentMethods = useCallback(async () => {
        if (!isDuitkuConfigured) return;
        setIsLoadingMethods(true);
        setMethodsError(null);
        try {
            const res = await getPaymentMethodsAction({ amount: transaction.amount });
            if (res.success && res.result) {
                setPaymentMethods(res.result.methods || []);
            } else {
                setMethodsError(res.error || "Gagal memuat metode pembayaran.");
            }
        } catch {
            setMethodsError("Terjadi kesalahan jaringan.");
        } finally {
            setIsLoadingMethods(false);
        }
    }, [transaction.amount, isDuitkuConfigured]);

    useEffect(() => {
        if (!customPaymentDetails) {
            const timer = setTimeout(() => {
                fetchPaymentMethods();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [fetchPaymentMethods, customPaymentDetails]);

    // ── Status polling ────────────────────────────────────────────────────────
    const checkStatus = useCallback(async () => {
        if (status === "paid" || status === "cancelled") return;
        setIsPolling(true);
        try {
            const res = await checkTransactionStatusAction({ transactionId: transaction.id });
            if (res.success && res.result) {
                setStatus(res.result.status);
                if (res.result.status === "paid") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setTimeout(() => {
                        setIsRedirecting(true);
                        router.push("/dashboard/billing?status=success");
                    }, 2500);
                }
            }
        } catch { /* silent */ } finally {
            setIsPolling(false);
        }
    }, [transaction.id, status, router]);

    useEffect(() => {
        if (status === "paid" || status === "cancelled" || expired) return;
        pollingRef.current = setInterval(checkStatus, 7000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [checkStatus, status, expired]);

    // ── Handle proceed with method ────────────────────────────────────────────
    const handleProceed = async () => {
        if (!selectedMethod || isProceeding) return;
        setIsProceeding(true);
        try {
            const res = await initializeCheckoutPaymentAction({ transactionId: transaction.id, paymentMethod: selectedMethod });
            if (res.success && res.result) {
                const data = res.result as any;
                if (data.success && data.paymentDetails) {
                    setCustomPaymentDetails(data.paymentDetails);
                } else {
                    alert(data.error || "Gagal memproses pembayaran.");
                }
            } else {
                alert(res.error || "Gagal memproses pembayaran kustom.");
            }
        } catch {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            setIsProceeding(false);
        }
    };

    const handleResetPayment = () => {
        setCustomPaymentDetails(null);
        setSelectedMethod(null);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    if (status === "paid" || isRedirecting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-background to-background p-4">
                <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 size={48} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Pembayaran Berhasil!</h1>
                        <p className="text-muted-foreground mt-2">Paket Anda sedang diaktifkan...</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold">
                        <Loader2 size={14} className="animate-spin" />
                        Mengalihkan ke dashboard...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/60 px-4 md:px-6 py-3.5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Kembali
                </button>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secured by Duitku</span>
                </div>
                {/* Spacer to keep middle element centered */}
                <div className="w-[70px] shrink-0" />
            </div>

            <div className="w-full px-4 md:px-8 py-5 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Column: Order Summary */}
                <OrderSummaryCard
                    transaction={transaction}
                    customPaymentDetails={customPaymentDetails}
                    expired={expired}
                    h={h}
                    m={m}
                    s={s}
                    copied={copied}
                    onCopy={handleCopy}
                    isPolling={isPolling}
                    onCheckStatus={checkStatus}
                />

                {/* Right Column: Payment Method & Details */}
                <div className="lg:col-span-3 space-y-3">
                    {!isDuitkuConfigured ? (
                        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
                            <AlertCircle size={32} className="mx-auto text-amber-500" />
                            <p className="font-black text-foreground">Payment gateway belum dikonfigurasi</p>
                            <p className="text-xs text-muted-foreground">Hubungi admin platform untuk menyelesaikan pembayaran Anda.</p>
                        </div>
                    ) : customPaymentDetails ? (
                        <PaymentDetailsCard
                            customPaymentDetails={customPaymentDetails}
                            copied={copied}
                            onCopy={handleCopy}
                            onResetPayment={handleResetPayment}
                        />
                    ) : (
                        <PaymentMethodSelector
                            isLoadingMethods={isLoadingMethods}
                            methodsError={methodsError}
                            paymentMethods={paymentMethods}
                            selectedMethod={selectedMethod}
                            onSelectMethod={setSelectedMethod}
                            onFetchPaymentMethods={fetchPaymentMethods}
                            onProceed={handleProceed}
                            isProceeding={isProceeding}
                            expired={expired}
                            expandedCategory={expandedCategory}
                            onToggleCategory={setExpandedCategory}
                            formatRp={formatRp}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
