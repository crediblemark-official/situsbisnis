
import Link from "next/link";
import { CheckCircle, ShoppingBag, Download, Lock, MessageCircle, AlertCircle, Landmark, ExternalLink } from "lucide-react";
import { db } from "@/lib/core/db";
import { getSiteSettings } from "@/lib/settings/site";

export default async function OrderSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ orderId: string }>;
}) {
    const { orderId } = await searchParams;

    if (!orderId) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-rose-600" size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Order Tidak Ditemukan</h1>
                    <p className="text-slate-500 mb-8">
                        Kami tidak dapat menemukan data pesanan untuk sesi ini. Silakan hubungi admin toko Anda.
                    </p>
                    <Link
                        href="/"
                        className="flex items-center justify-center w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                    >
                        <ShoppingBag className="mr-2" size={18} />
                        Kembali Belanja
                    </Link>
                </div>
            </div>
        );
    }

    const dbOrder = await db.order.findUnique({
        where: { id: orderId },
        include: {
            items: true
        }
    });

    if (!dbOrder) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
                    <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-rose-600" size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Pesanan Tidak Ditemukan</h1>
                    <p className="text-slate-500 mb-6">
                        Order dengan ID <span className="font-mono text-slate-800">{orderId}</span> tidak ditemukan.
                    </p>
                    <Link
                        href="/"
                        className="flex items-center justify-center w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
                    >
                        <ShoppingBag className="mr-2" size={18} />
                        Kembali Belanja
                    </Link>
                </div>
            </div>
        );
    }

    const { CatalogClient } = await import("@/modules/catalog");
    const productIds = dbOrder.items.map(item => item.productId);
    const productsMap = await CatalogClient.getProductsMap(productIds);

    const decoratedItems = dbOrder.items.map(item => ({
        ...item,
        product: productsMap[item.productId] || { id: item.productId, name: "", metaData: [] }
    }));

    const order = {
        ...dbOrder,
        items: decoratedItems
    };



    // Check if there are any digital products in this order
    const digitalItems = order.items
        .filter(item => {
            return item.product.metaData?.some(
                m => m.key === "_isDigital" && m.value === "true"
            );
        })
        .map(item => {
            const downloadUrl = item.product.metaData?.find(
                m => m.key === "_downloadUrl"
            )?.value || "";
            return {
                id: item.product.id,
                name: item.product.name,
                downloadUrl
            };
        });

    const isDigitalOrder = digitalItems.length > 0;
    const isPaid = order.paymentStatus === "paid";

    // Get site and payment settings
    const siteSettings = await getSiteSettings(order.siteId);
    const paymentSettings = await db.paymentSettings.findUnique({
        where: { siteId: order.siteId }
    });

    const whatsappNumber = siteSettings?.whatsappNumber || siteSettings?.socialWhatsapp || "";
    
    // Clean whatsappNumber (remove non-digits, replace starting 0 with 62)
    const formattedWa = whatsappNumber ? whatsappNumber.replace(/\D/g, "") : "";
    const cleanWa = formattedWa.startsWith("0") ? "62" + formattedWa.substring(1) : formattedWa;
    
    // Prefilled message for manual confirmation
    const waMessage = `Halo Admin, saya ingin melakukan konfirmasi pembayaran untuk pesanan:
Order ID: ${order.id}
Nama: ${order.customerName}
Email: ${order.customerEmail}
Total: Rp ${Number(order.total).toLocaleString("id-ID")}

Berikut saya lampirkan bukti transfernya. Mohon bantuannya untuk memproses pesanan saya. Terima kasih!`;
    const waLink = cleanWa ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(waMessage)}` : "";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 py-12 md:py-24">
            <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full text-center border border-slate-100 overflow-hidden">
                {/* Header Section */}
                <div className="p-8 pb-4">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                        <CheckCircle className="text-emerald-600" size={40} />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Order Berhasil Dibuat!</h1>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed mb-6">
                        Terima kasih atas pembelian Anda. Pesanan Anda telah kami terima dan sedang diproses.
                    </p>

                    <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 flex flex-col items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ID Pesanan</span>
                        <span className="font-mono font-bold text-slate-700 select-all text-sm md:text-base px-3 py-1 bg-slate-100 rounded border border-slate-200">
                            {order.id}
                        </span>
                    </div>
                </div>

                {/* Digital Products Delivery Block */}
                {isDigitalOrder && (
                    <div className="bg-slate-50 border-t border-b border-slate-100 p-6 md:p-8 text-left">
                        {isPaid ? (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200">
                                        <Download size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Akses Produk Digital Anda Aktif! ⚡</h3>
                                        <p className="text-xs text-slate-500">File sudah siap dan aman untuk diunduh sekarang.</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {digitalItems.map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-emerald-500/30 transition-all gap-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                                                    {idx + 1}
                                                </span>
                                                <p className="font-semibold text-sm text-slate-800 truncate" title={item.name}>
                                                    {item.name}
                                                </p>
                                            </div>
                                            {item.downloadUrl ? (
                                                <a
                                                    href={item.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-200 active:scale-95 transition-all text-center"
                                                >
                                                    <Download size={14} />
                                                    Unduh File
                                                    <ExternalLink size={12} className="opacity-70" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/50 font-medium">
                                                    Hubungi admin untuk link file
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-200">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Akses File Terkunci 🔒</h3>
                                        <p className="text-xs text-slate-500">Tautan download otomatis aktif setelah pembayaran terverifikasi.</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                    <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                        Tautan unduhan instan akan muncul di halaman ini segera setelah pembayaran Anda dikonfirmasi oleh sistem/admin.
                                    </p>
                                </div>

                                {/* Bank details for manual transfers */}
                                {order.paymentMethod === "manual" && paymentSettings && (
                                    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                                            <Landmark size={18} className="text-slate-500" />
                                            <span>Informasi Rekening Pembayaran</span>
                                        </div>
                                        <div className="space-y-2.5 text-sm border-b border-slate-100 pb-3 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Bank:</span>
                                                <span className="font-bold text-slate-800">{paymentSettings.bankName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">No. Rekening:</span>
                                                <span className="font-mono font-bold text-slate-800 select-all">{paymentSettings.accountNumber}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Atas Nama:</span>
                                                <span className="font-bold text-slate-800">{paymentSettings.accountHolder}</span>
                                            </div>
                                        </div>
                                        {paymentSettings.instructions && (
                                            <div className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                                                {paymentSettings.instructions}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {waLink && (
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:shadow-emerald-200 active:scale-[0.98] transition-all text-sm"
                                        >
                                            <MessageCircle size={18} />
                                            Konfirmasi Pembayaran via WhatsApp
                                        </a>
                                    )}

                                    <Link
                                        href={`/checkout/success?orderId=${order.id}`}
                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-xs"
                                    >
                                        Segarkan Status Pembayaran ⚡
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer / Standard Actions */}
                <div className="p-8 pt-6 flex flex-col gap-3">
                    <Link
                        href="/"
                        className="flex items-center justify-center w-full py-3 text-slate-700 font-bold rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors text-sm"
                    >
                        <ShoppingBag className="mr-2" size={16} />
                        Kembali Ke Toko
                    </Link>
                </div>
            </div>
        </div>
    );
}
