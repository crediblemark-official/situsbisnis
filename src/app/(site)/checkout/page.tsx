"use client";

import React, { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useCurrency } from "@/hooks/use-currency";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PaymentMethodInfo from "@/components/shop/PaymentMethodInfo";
import { usePlatformSettings } from "@/hooks/use-platform-settings";
import { Truck } from "lucide-react";
import { formatWhatsAppMessage } from "@/components/site/checkout/utils";
import { CheckoutForm } from "@/components/site/checkout/CheckoutForm";
import { CheckoutMethodSelector } from "@/components/site/checkout/CheckoutMethodSelector";
import { CheckoutSummary } from "@/components/site/checkout/CheckoutSummary";

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const { settings } = usePlatformSettings();
    const brandColor = settings?.brandColor || "#0ea5e9";
    const router = useRouter();

    const showOrders = settings?.enabledOrders ?? true;
    const showWhatsapp = settings?.enabledWhatsappCheckout ?? false;

    const [userSelectedMethod, setUserSelectedMethod] = useState<"system" | "whatsapp" | null>(null);
    const defaultMethod = !showOrders && showWhatsapp ? "whatsapp" : "system";
    const checkoutMethod = userSelectedMethod || defaultMethod;
    const [systemPaymentMethod, setSystemPaymentMethod] = useState<"system" | "manual">("system");
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zip: "",
    });

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-sm border"
                    style={{ backgroundColor: `${brandColor}08`, borderColor: `${brandColor}15`, color: brandColor }}
                >
                    <Truck size={28} />
                </div>
                <h1 className="text-lg font-bold text-slate-800 mb-1.5 tracking-tight">Keranjang Belanja Kosong</h1>
                <p className="text-slate-500 mb-6 max-w-xs leading-relaxed text-xs font-normal">Sepertinya Anda belum memilih produk apa pun untuk dibeli. Mari mulai berbelanja!</p>
                <Link 
                    href="/" 
                    className="px-5 py-2.5 text-xs font-semibold text-white rounded-lg active:scale-95 transition-all shadow-sm"
                    style={{ backgroundColor: brandColor }}
                >
                    Jelajahi Produk
                </Link>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            // 1. Simpan order ke database terlebih dahulu (berlaku untuk kedua metode)
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    paymentMethod: checkoutMethod === "system" ? systemPaymentMethod : checkoutMethod,
                    items: items.map(i => ({ 
                        productId: i.productId, 
                        quantity: i.quantity, 
                        price: i.price,
                        variantName: i.variantName,
                        attributes: i.attributes
                    }))
                })
            });

            if (!res.ok) throw new Error("Order failed");

            const data = await res.json();
            const orderId = data.id;

            // 2. Jika metodenya adalah WhatsApp, buka WhatsApp dengan ID pesanan resmi
            if (checkoutMethod === "whatsapp") {
                const phone = settings?.whatsappNumber || settings?.socialWhatsapp || "";
                if (!phone) {
                    alert("Nomor WhatsApp toko tidak tersedia. Silakan hubungi admin toko.");
                    setIsProcessing(false);
                    return;
                }

                // Format phone number to clean WhatsApp API compliant format (remove non-digits, replace leading 0 with 62)
                let cleanPhone = phone.replace(/\D/g, '');
                if (cleanPhone.startsWith('0')) {
                    cleanPhone = '62' + cleanPhone.substring(1);
                }

                // Format the message
                const messageText = formatWhatsAppMessage({
                    orderId,
                    items,
                    formData,
                    cartTotal,
                    formatPrice,
                    settings,
                });

                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

                clearCart();
                window.open(waUrl, "_blank");
                router.push("/");
            } else {
                // 3. Jika metodenya adalah sistem pesanan biasa, arahkan ke gerbang pembayaran
                clearCart();
                if (data.paymentUrl) {
                    // Redirect to custom branded checkout page instead of Midtrans directly
                    router.push(`/checkout/payment/${orderId}`);
                } else {
                    router.push(`/checkout/success?orderId=${orderId}`);
                }
            }

        } catch (error) {
            console.error(error);
            alert("Terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Navigation */}
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors mb-2 group"
                    >
                        Lanjut Belanja
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight text-center">
                        Pembayaran <span style={{ color: brandColor }}>Aman</span>
                    </h1>
                </div>

                {/* Mobile collapsible summary at the top of the page */}
                <CheckoutSummary
                    items={items}
                    cartTotal={cartTotal}
                    formatPrice={formatPrice}
                    brandColor={brandColor}
                    isSummaryExpanded={isSummaryExpanded}
                    setIsSummaryExpanded={setIsSummaryExpanded}
                    checkoutMethod={checkoutMethod}
                    isProcessing={isProcessing}
                    mode="mobile-top"
                />

                {/* Main Checkout Layout Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Customer Form & Payment (Flat, directly on background) */}
                    <div className="lg:col-span-7 space-y-8">
                        
                        {/* Tab Selector if both are active */}
                        {showOrders && showWhatsapp && (
                            <CheckoutMethodSelector
                                brandColor={brandColor}
                                checkoutMethod={checkoutMethod}
                                setCheckoutMethod={setUserSelectedMethod}
                            />
                        )}

                        {/* Shipping Form Section */}
                        <CheckoutForm
                            brandColor={brandColor}
                            formData={formData}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                        />

                        {/* Payment Method Section (Flat, directly on background) */}
                        <div className="pt-2">
                            {checkoutMethod === "system" ? (
                                <PaymentMethodInfo 
                                    brandColor={brandColor} 
                                    selectedMethod={systemPaymentMethod}
                                    onMethodSelect={setSystemPaymentMethod}
                                />
                            ) : (
                                <div className="w-full animate-in fade-in duration-300">
                                    <h2 className="text-sm font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
                                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </div>
                                        Konfirmasi via WhatsApp
                                    </h2>

                                    <div className="p-4 rounded-xl border mb-3 bg-emerald-50/20 border-emerald-500/20 shadow-sm">
                                        <h3 className="font-semibold text-slate-800 text-sm mb-0.5 text-emerald-800">Transaksi Instan via WhatsApp</h3>
                                        <p className="text-xs text-slate-600 mb-3 font-normal">Pesanan Anda akan dikompilasi secara otomatis dan dikirimkan ke chat WhatsApp Admin toko.</p>
                                        
                                        <div className="text-xs text-slate-500 bg-white border border-slate-200/80 p-3.5 rounded-lg leading-relaxed font-normal space-y-2">
                                            <span className="font-semibold text-slate-700 block">Langkah-langkah:</span>
                                            <ol className="list-decimal pl-4 space-y-1">
                                                <li>Isi formulir informasi pengiriman di atas dengan lengkap.</li>
                                                <li>Klik tombol <strong className="font-bold text-slate-700">Kirim Pesanan ke WhatsApp</strong> di sebelah kanan.</li>
                                                <li>Sistem akan mengarahkan Anda ke aplikasi WhatsApp dengan pesan pesanan yang sudah terisi otomatis.</li>
                                                <li>Kirim pesan tersebut untuk menyelesaikan transaksi dengan Admin.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile checkout summary with totals and main checkout button at the bottom of the page */}
                        <CheckoutSummary
                            items={items}
                            cartTotal={cartTotal}
                            formatPrice={formatPrice}
                            brandColor={brandColor}
                            checkoutMethod={checkoutMethod}
                            isProcessing={isProcessing}
                            mode="mobile-bottom"
                        />
                    </div>

                    {/* Right Column: Sticky Summary for Desktop */}
                    <CheckoutSummary
                        items={items}
                        cartTotal={cartTotal}
                        formatPrice={formatPrice}
                        brandColor={brandColor}
                        checkoutMethod={checkoutMethod}
                        isProcessing={isProcessing}
                        mode="desktop"
                    />
                </div>
            </div>
        </div>
    );
}
