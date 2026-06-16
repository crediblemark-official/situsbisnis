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
    Building2,
    Smartphone,
    Wallet,
    CreditCard,
    Copy,
    Check,
    AlertCircle,
    Zap,
    ShoppingBag,
    ChevronDown,
} from "lucide-react";

interface PaymentMethod {
    paymentMethod: string;
    paymentName: string;
    paymentImage: string;
    totalFee: string;
    category?: string;
}

interface OrderData {
    id: string;
    amount: number;
    paymentUrl: string | null;
    paymentReference: string | null;
    customerName: string;
    siteName: string;
    createdAt: string;
}

interface ShopCheckoutPaymentProps {
    order: OrderData;
    platformName: string;
}

// ─── Category Helpers ──────────────────────────────────────────────────────────
function getCategoryLabel(code: string, name: string = "") {
    if (code === "manual") return "Transfer Bank (Manual)";
    const c = code.toUpperCase();
    const n = name.toUpperCase();
    if (c.includes("QR") || n.includes("QRIS")) return "QRIS";
    if (c.includes("VA") || n.includes("VA") || n.includes("VIRTUAL ACCOUNT") || ["I1", "BT", "A1", "M2", "V1", "B1", "AG", "NC", "BR", "S1", "BS", "MY"].some(p => c.startsWith(p.slice(0, 2)))) return "Virtual Account";
    if (["OV", "GO", "SH", "DA", "LA", "OL", "SL", "GP", "OP", "DN", "JA", "JN", "JP"].some(p => c.startsWith(p.slice(0, 2))) || n.includes("OVO") || n.includes("DANA") || n.includes("GOPAY") || n.includes("LINKAJA") || n.includes("SHOPEEPAY") || n.includes("JENIUS")) return "E-Wallet";
    if (c.startsWith("FT") || c.startsWith("AL") || n.includes("INDOMARET") || n.includes("ALFAMART") || n.includes("RETAIL")) return "Retail / Gerai";
    if (c.startsWith("VC") || n.includes("CREDIT CARD") || n.includes("KARTU KREDIT")) return "Kartu Kredit";
    if (n.includes("PAYLATER") || n.includes("INDODANA") || n.includes("AKULAKU") || n.includes("KREDIVO")) return "Paylater / Cicilan";
    return "Lainnya";
}

function getCategoryIcon(label: string) {
    if (label === "Virtual Account") return <Building2 size={14} />;
    if (label === "E-Wallet") return <Wallet size={14} />;
    if (label === "QRIS") return <Smartphone size={14} />;
    if (label === "Kartu Kredit") return <CreditCard size={14} />;
    if (label === "Paylater / Cicilan") return <CreditCard size={14} />;
    return <CreditCard size={14} />;
}

// ─── Countdown Timer ───────────────────────────────────────────────────────────
function useCountdown(createdAt: string, expiryMinutes = 1440) {
    const [secondsLeft, setSecondsLeft] = useState(0);
    useEffect(() => {
        const expiryTime = new Date(createdAt).getTime() + expiryMinutes * 60 * 1000;
        const update = () => setSecondsLeft(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [createdAt, expiryMinutes]);
    return { h: Math.floor(secondsLeft / 3600), m: Math.floor((secondsLeft % 3600) / 60), s: secondsLeft % 60, expired: secondsLeft === 0 };
}

// ─── Payment Instructions Helper ───────────────────────────────────────────────
function getPaymentInstructions(method: string, payCode: string, isQris: boolean = false) {
    if (method === "manual") return [];
    if (isQris) {
        return [
            "Buka aplikasi e-wallet (Gopay, OVO, DANA, LinkAja, ShopeePay) atau mobile banking pilihan Anda",
            "Pilih opsi 'Scan' / 'Pindai' / 'Bayar' di dalam aplikasi tersebut",
            "Arahkan kamera HP Anda ke QR Code yang ditampilkan di atas",
            "Konfirmasi detail nominal dan masukkan PIN Anda untuk menyelesaikan pembayaran"
        ];
    }
    const m = method.toUpperCase();
    if (m === "B1") { // BCA
        return [
            "Buka aplikasi BCA Mobile atau KlikBCA",
            "Pilih menu 'm-Transfer' > 'BCA Virtual Account'",
            `Masukkan nomor Virtual Account: ${payCode}`,
            "Detail pesanan Anda akan muncul. Masukkan PIN BCA untuk menyelesaikan pembayaran"
        ];
    }
    if (m === "I1") { // Mandiri
        return [
            "Buka aplikasi Livin' by Mandiri",
            "Pilih menu 'Bayar' > 'Buat Pembayaran Baru' > 'Multipayment'",
            "Cari penyedia jasa / institusi Duitku",
            `Masukkan nomor Virtual Account: ${payCode}`,
            "Detail tagihan akan muncul. Konfirmasi pembayaran dan masukkan PIN Livin' Anda"
        ];
    }
    if (m === "BT") { // Permata
        return [
            "Masukkan kartu ATM Permata Anda",
            "Pilih menu 'Transaksi Lainnya' > 'Pembayaran' > 'Lain-lain' > 'Virtual Account'",
            `Masukkan nomor Virtual Account: ${payCode}`,
            "Konfirmasi detail transaksi dan selesaikan pembayaran"
        ];
    }
    if (m === "BR") { // BRI (BRIVA)
        return [
            "Buka aplikasi BRImo",
            "Pilih menu 'Lainnya' > 'BRIVA'",
            "Pilih 'Pembayaran Baru'",
            `Masukkan nomor BRIVA: ${payCode}`,
            "Konfirmasi nominal, masukkan PIN BRImo Anda untuk memproses pembayaran"
        ];
    }
    if (m === "S1") { // BNI
        return [
            "Buka aplikasi BNI Mobile Banking",
            "Pilih menu 'Transfer' > 'Virtual Account Billing'",
            "Pilih rekening debit, lalu pilih 'Input Baru'",
            `Masukkan nomor Virtual Account BNI: ${payCode}`,
            "Detail tagihan akan muncul. Masukkan Password Transaksi Anda untuk konfirmasi"
        ];
    }
    if (m === "FT") { // Indomaret
        return [
            "Kunjungi gerai Indomaret terdekat",
            "Sampaikan ke kasir bahwa Anda ingin melakukan pembayaran Duitku / Merchant",
            `Berikan kode pembayaran berikut kepada kasir: ${payCode}`,
            "Lakukan pembayaran sesuai nominal yang disebutkan oleh kasir dan simpan struk pembayaran Anda"
        ];
    }
    if (m === "AL") { // Alfamart
        return [
            "Kunjungi gerai Alfamart terdekat",
            "Sampaikan ke kasir bahwa Anda ingin melakukan pembayaran Duitku / Merchant",
            `Berikan kode pembayaran berikut kepada kasir: ${payCode}`,
            "Lakukan pembayaran sesuai nominal dan pastikan Anda menerima struk tanda terima resmi"
        ];
    }
    // General fallback
    return [
        `Gunakan aplikasi mobile banking / e-wallet pilihan Anda`,
        `Gunakan kode pembayaran / nomor VA berikut untuk membayar: ${payCode}`,
        "Ikuti instruksi pembayaran di aplikasi Anda untuk menyelesaikan transaksi",
        "Pembayaran Anda akan terdeteksi otomatis dalam beberapa menit"
    ];
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
    const [expandedCategory, setExpandedCategory] = useState<string | null>("Virtual Account");
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
        } catch { /* silent */ } finally {
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

    const grouped = methods.reduce<Record<string, PaymentMethod[]>>((acc, m) => {
        const cat = m.category || "Lainnya";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
    }, {});

    const categoryOrder = ["Virtual Account", "QRIS", "E-Wallet", "Retail / Gerai", "Kartu Kredit", "Paylater / Cicilan", "Lainnya"];

    // Success state
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

    // Payment display helper details
    const payCode = customPaymentDetails?.vaNumber || customPaymentDetails?.paymentCode || customPaymentDetails?.qrString;
    const isQris = !!(customPaymentDetails?.qrString || customPaymentDetails?.qrCodeUrl || (customPaymentDetails?.paymentMethod && getCategoryLabel(customPaymentDetails.paymentMethod) === "QRIS"));
    const paymentInstructions = customPaymentDetails ? getPaymentInstructions(customPaymentDetails.paymentMethod, payCode || "", isQris) : [];
    const qrCodeImageUrl = (customPaymentDetails?.qrString
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(customPaymentDetails.qrString)}`
        : customPaymentDetails?.qrCodeUrl) || null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
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

                {/* Left: Order Summary */}
                <div className="lg:col-span-2 space-y-3 lg:sticky lg:top-20">

                    {/* Countdown */}
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

                    {/* Summary */}
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

                    {/* Polling indicator */}
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

                {/* Right: Payment Method & Details */}
                <div className="lg:col-span-3 space-y-3">
                    {customPaymentDetails ? (
                        /* ── Custom Payment Details View ── */
                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                        {getCategoryLabel(customPaymentDetails.paymentMethod)}
                                    </span>
                                    <h3 className="text-base font-bold text-gray-900 mt-1">Pembayaran Kustom</h3>
                                </div>
                                <button 
                                    onClick={handleResetPayment}
                                    className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold flex items-center gap-1 transition-colors"
                                >
                                    Ganti Metode
                                </button>
                            </div>

                            {/* Main Payment Code / QRIS Card */}
                            {isQris ? (
                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                    {qrCodeImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img 
                                            src={qrCodeImageUrl} 
                                            alt="QRIS QR Code" 
                                            className="w-48 h-48 object-contain rounded-md border bg-white p-2 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-52 h-52 flex items-center justify-center bg-white border rounded-lg text-xs text-gray-400">
                                            Memuat QR Code...
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-800">Scan QRIS untuk Membayar</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Kompatibel dengan semua e-wallet & mobile banking</p>
                                    </div>
                                </div>
                            ) : customPaymentDetails.paymentMethod === "manual" ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 shadow-inner">
                                    <div className="flex justify-between items-center text-xs border-b border-gray-200/50 pb-2">
                                        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[9px]">Nama Bank</span>
                                        <span className="font-bold text-gray-850 uppercase tracking-tight text-xs">{customPaymentDetails.bankName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-b border-gray-200/50 pb-2">
                                        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[9px]">Pemilik Rekening</span>
                                        <span className="font-bold text-gray-850 uppercase tracking-tight text-xs">{customPaymentDetails.accountHolder}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[9px]">Nomor Rekening</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-black text-gray-900 text-sm tracking-tight">{payCode}</span>
                                            <button 
                                                onClick={() => handleCopy(payCode || "")}
                                                className="p-1 rounded bg-white hover:bg-slate-100 border border-gray-200 text-gray-550 transition-colors"
                                                title="Salin Nomor Rekening"
                                            >
                                                {copied === payCode ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                                        {getCategoryLabel(customPaymentDetails.paymentMethod) === "Virtual Account" ? "Nomor Virtual Account" : "Kode Pembayaran"}
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl font-mono font-black text-gray-900 tracking-wider">
                                            {payCode}
                                        </span>
                                        <button 
                                            onClick={() => handleCopy(payCode || "")}
                                            className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition-colors"
                                            title="Salin Kode"
                                        >
                                            {copied === payCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Payment Instructions */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Instruksi Pembayaran</h4>
                                {customPaymentDetails.paymentMethod === "manual" ? (
                                    <p className="text-xs text-gray-650 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200/50">
                                        {customPaymentDetails.instructions || "Silakan transfer ke rekening di atas dan konfirmasi ke admin."}
                                    </p>
                                ) : (
                                    <ol className="list-decimal list-inside space-y-2 text-xs text-gray-600 leading-relaxed pl-1">
                                        {paymentInstructions.map((step, idx) => (
                                            <li key={idx} className="marker:font-semibold pl-1">
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex gap-2.5 items-start text-xs text-amber-800">
                                <AlertCircle size={16} className="shrink-0 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Menunggu Pembayaran</p>
                                    <p className="text-[11px] text-amber-700/90 mt-0.5">Sistem memantau pembayaran Anda secara otomatis. Halaman akan dialihkan saat transaksi terverifikasi.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── Payment Method Selection View ── */
                        <>
                            {isLoadingMethods ? (
                                <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-4 shadow-sm">
                                    <Loader2 size={22} className="animate-spin text-blue-500" />
                                    <p className="text-xs text-gray-500">Memuat metode pembayaran...</p>
                                </div>
                            ) : methodsError ? (
                                <div className="bg-white border border-red-200 rounded-xl p-5 text-center space-y-3 shadow-sm">
                                    <AlertCircle size={22} className="mx-auto text-red-400" />
                                    <p className="text-xs font-semibold text-red-500">{methodsError}</p>
                                    <button onClick={fetchMethods} className="text-xs text-blue-500 underline flex items-center gap-1 mx-auto">
                                        <RefreshCw size={11} /> Coba lagi
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3.5">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Pilih Metode Pembayaran</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Semua transaksi diproses secara aman.</p>
                                        </div>

                                        <div className="space-y-2">
                                            {categoryOrder.filter(cat => grouped[cat]?.length).map(cat => {
                                                const isOpen = expandedCategory === cat;
                                                return (
                                                    <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200">
                                                        {/* Accordion Header */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedCategory(isOpen ? null : cat)}
                                                            className={`w-full flex items-center justify-between p-3.5 text-left transition-colors ${
                                                                isOpen ? "bg-gray-50/70 border-b border-gray-100" : "hover:bg-gray-50/40"
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className={isOpen ? "text-blue-600" : "text-gray-400"}>
                                                                    {getCategoryIcon(cat)}
                                                                </span>
                                                                <div>
                                                                    <p className={`text-xs font-bold ${isOpen ? "text-gray-900" : "text-gray-700"}`}>
                                                                        {cat}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                                                        {grouped[cat].length} pilihan pembayaran
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`transition-transform duration-250 ${isOpen ? "rotate-180 text-blue-500" : "text-gray-400"}`}>
                                                                <ChevronDown size={16} />
                                                            </div>
                                                        </button>

                                                        {/* Accordion Content */}
                                                        {isOpen && (
                                                            <div className="p-3 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {grouped[cat].map(method => (
                                                                        <button
                                                                            key={method.paymentMethod}
                                                                            type="button"
                                                                            onClick={() => setSelectedMethod(method.paymentMethod)}
                                                                            className={`flex items-center gap-3 p-2.5 rounded-lg border-2 text-left transition-all duration-200 ${
                                                                                selectedMethod === method.paymentMethod
                                                                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                                                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                                                            }`}
                                                                        >
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img
                                                                                src={method.paymentImage}
                                                                                alt={method.paymentName}
                                                                                className="w-10 h-7 object-contain rounded-sm"
                                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[11px] font-bold text-gray-800 truncate">{method.paymentName}</p>
                                                                                {Number(method.totalFee) > 0 && (
                                                                                    <p className="text-[9px] text-gray-400">
                                                                                        Biaya: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(method.totalFee))}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                                                                                selectedMethod === method.paymentMethod ? "border-blue-500 bg-blue-500" : "border-gray-300"
                                                                            }`}>
                                                                                {selectedMethod === method.paymentMethod && (
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {Object.keys(grouped).length === 0 && (
                                                <div className="text-center py-8 text-gray-400">
                                                    <p className="text-sm">Tidak ada metode pembayaran tersedia</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleProceed}
                                        disabled={!selectedMethod || isProceeding || expired}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                                    >
                                        {isProceeding ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={15} />
                                                {expired ? "Sesi Kedaluwarsa" : "Lanjutkan Pembayaran"}
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-[9px] text-gray-400 leading-relaxed px-2">
                                        Dengan melanjutkan, Anda akan langsung melihat instruksi pembayaran kustom kami.
                                        Pesanan akan dikonfirmasi otomatis setelah pembayaran berhasil.
                                    </p>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
