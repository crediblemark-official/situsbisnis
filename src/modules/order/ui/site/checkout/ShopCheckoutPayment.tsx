"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Copy,
    Check,
    ShoppingBag,
} from "lucide-react";

import { type OrderData, type PaymentMethod } from "./types";
import { useCountdown } from "./hooks/useCountdown";
import { PaymentInstructionsView } from "./components/PaymentInstructionsView";
import { PaymentMethodSelectionView } from "./components/PaymentMethodSelectionView";

interface ShopCheckoutPaymentProps {
    order: OrderData;
    platformName: string;
}

/**
 * Komponen utama tampilan halaman checkout pembayaran
 */
export function ShopCheckoutPayment({ order, platformName: _platformName }: ShopCheckoutPaymentProps) {
    const router = useRouter();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [isLoadingMethods, setIsLoadingMethods] = useState(false);
    const [methodsError, setMethodsError] = useState<string | null>(null);
    const [status, setStatus] = useState("pending");
    const [isPolling, setIsPolling] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProceeding, setIsProceeding] = useState(false);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { h, m, s, expired } = useCountdown(order.createdAt);

    const [customPaymentDetails, setCustomPaymentDetails] = useState<any>(() => {
        if (order.paymentUrl && order.paymentUrl.startsWith("custom:")) {
            try {
                return JSON.parse(order.paymentUrl.substring(7));
            } catch {
                return null;
            }
        }
        return null;
    });

    const formatRp = (n: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

    const fetchMethods = useCallback(async () => {
        setIsLoadingMethods(true);
        setMethodsError(null);
        try {
            const res = await fetch("/api/orders/payment-methods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
            });
            if (res.ok) {
                const data = await res.json();
                setMethods(data.methods || []);
            } else {
                setMethodsError("Gagal memuat metode pembayaran.");
            }
        } catch {
            setMethodsError("Terjadi kesalahan jaringan.");
        } finally {
            setIsLoadingMethods(false);
        }
    }, [order.id]);

    useEffect(() => { 
        if (!customPaymentDetails) {
            const timer = setTimeout(() => {
                fetchMethods(); 
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [fetchMethods, customPaymentDetails]);

    const checkStatus = useCallback(async () => {
        if (status === "paid" || status === "approved") return;
        setIsPolling(true);
        try {
            const res = await fetch("/api/orders/check-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
            });
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                if (data.status === "paid" || data.status === "approved") {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setTimeout(() => {
                        setIsSuccess(true);
                        router.push(`/checkout/success?orderId=${order.id}`);
                    }, 2000);
                }
            }
        } catch { /* diam */ } finally {
            setIsPolling(false);
        }
    }, [order.id, status, router]);

    useEffect(() => {
        if (status === "paid" || status === "approved" || expired) return;
        pollingRef.current = setInterval(checkStatus, 7000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [checkStatus, status, expired]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleProceed = async () => {
        if (!selectedMethod || isProceeding) return;
        setIsProceeding(true);
        try {
            const res = await fetch("/api/orders/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, paymentMethod: selectedMethod }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.paymentDetails) {
                    setCustomPaymentDetails(data.paymentDetails);
                } else {
                    alert(data.error || "Gagal memproses pembayaran.");
                }
            } else {
                alert("Gagal menghubungi server untuk memproses pembayaran.");
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

    // Tampilan sukses
    if (isSuccess || status === "paid" || status === "approved") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-white p-4">
                <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pembayaran Berhasil!</h1>
                        <p className="text-gray-500 mt-1 text-sm">Pesanan Anda sedang diproses...</p>
                    </div>
                    <Loader2 size={16} className="animate-spin text-emerald-500 mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigasi Atas */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <Link href="/checkout" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors group">
                        <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                        Kembali
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Secured by Duitku</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
                        <ShoppingBag size={9} />
                        {order.siteName}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Kiri: Ringkasan Pesanan */}
                <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-20">
                    {/* Waktu Hitung Mundur */}
                    <div className={`rounded-xl border p-3.5 flex items-center gap-3 ${
                        expired ? "bg-red-50 border-red-200" : "bg-white border-gray-200 shadow-sm"
                    }`}>
                        <Clock size={18} className={expired ? "text-red-500" : "text-blue-500"} />
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                {expired ? "Sesi Kedaluwarsa" : "Sesi Berakhir Dalam"}
                            </p>
                            {expired ? (
                                <p className="text-sm font-bold text-red-500">Silakan buat pesanan baru</p>
                            ) : (
                                <p className="text-xl font-mono font-bold text-gray-900 tabular-nums">
                                    {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Rincian Pesanan */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                        <div>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Ringkasan Pesanan</p>
                            <h2 className="text-base font-bold text-gray-900 mt-1">Pesanan dari {order.siteName}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">a.n. {order.customerName}</p>
                        </div>

                        <div className="border-t border-gray-100 pt-3 space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>ID Pesanan</span>
                                <button
                                    onClick={() => handleCopy(order.id)}
                                    className="flex items-center gap-1 font-mono text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    {order.id.slice(0, 12)}…
                                    {copied === order.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                </button>
                            </div>
                            {(order.paymentReference || customPaymentDetails?.reference) && (
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>No. Referensi</span>
                                    <button
                                        onClick={() => handleCopy((order.paymentReference || customPaymentDetails?.reference)!)}
                                        className="flex items-center gap-1 font-mono text-gray-700 hover:text-blue-600 transition-colors"
                                    >
                                        {order.paymentReference || customPaymentDetails?.reference}
                                        {copied === (order.paymentReference || customPaymentDetails?.reference) ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3.5 flex justify-between items-center">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Total Bayar</span>
                            <span className="text-2xl font-bold text-gray-900">{formatRp(order.amount)}</span>
                        </div>
                    </div>

                    {/* Status Polling */}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 px-1">
                        {isPolling
                            ? <><Loader2 size={10} className="animate-spin text-blue-500" /> Memeriksa status...</>
                            : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Memantau pembayaran otomatis</>
                        }
                        <button onClick={checkStatus} disabled={isPolling} className="ml-auto text-blue-500 hover:underline flex items-center gap-1">
                            <RefreshCw size={9} className={isPolling ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Kanan: Metode Pembayaran & Detail */}
                <div className="lg:col-span-3 space-y-3">
                    {customPaymentDetails ? (
                        <PaymentInstructionsView
                            customPaymentDetails={customPaymentDetails}
                            handleResetPayment={handleResetPayment}
                            copied={copied}
                            handleCopy={handleCopy}
                        />
                    ) : (
                        <PaymentMethodSelectionView
                            methods={methods}
                            selectedMethod={selectedMethod}
                            setSelectedMethod={setSelectedMethod}
                            isLoadingMethods={isLoadingMethods}
                            methodsError={methodsError}
                            fetchMethods={fetchMethods}
                            handleProceed={handleProceed}
                            isProceeding={isProceeding}
                            expired={expired}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
