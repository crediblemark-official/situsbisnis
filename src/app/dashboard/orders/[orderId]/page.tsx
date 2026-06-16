
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, ShoppingBag, MessageSquare, CreditCard, Building2 } from "lucide-react";
import OrderStatusManager from "./OrderStatusManager";
import { getPaymentSettings } from "@/lib/settings/payment";
import { formatPrice } from "@/lib/billing/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrderClient } from "@/modules/order";
import { getSiteId } from "@/lib/domains/tenant";

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId } = await params;

    const paymentSettings = await getPaymentSettings();
    const currency = paymentSettings.currency || "USD";

    const siteId = await getSiteId();
    if (!siteId) {
        return notFound();
    }

    let order;
    try {
        order = await OrderClient.getOrderDetail(orderId, siteId);
    } catch {
        return notFound();
    }

    const formattedItems = order.items.map(item => {
        return {
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            productName: item.product?.name,
            productImage: item.product?.images,
        };
    });

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6">
            <PageHeader 
                title={`Pesanan #${order.id.slice(0, 8)}`}
                subtitle={new Date(order.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}
                icon={<Package />}
            >
                <Link href="/dashboard/orders" className="px-3 md:px-4 py-1.5 bg-muted/10 border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/20 transition-all flex items-center gap-2">
                    <ArrowLeft size={14} /> <span className="hidden md:inline">Kembali</span>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Total Summary */}
                    <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Pesanan</div>
                            <div className="text-2xl font-bold text-foreground tracking-tight mt-1">{formatPrice(order.total, currency)}</div>
                        </div>
                        <div className="flex gap-2 items-center">
                            {order.paymentMethod === 'whatsapp' ? (
                                <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-500" title="Transaksi via WhatsApp">
                                    <MessageSquare size={14} />
                                </div>
                            ) : order.paymentMethod === 'manual' ? (
                                <div className="p-2 rounded-lg border bg-purple-500/10 border-purple-500/20 text-purple-400" title="Transfer Bank Manual">
                                    <Building2 size={14} />
                                </div>
                            ) : (
                                <div className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400" title="Pembayaran Otomatis (Gateway)">
                                    <CreditCard size={14} />
                                </div>
                            )}
                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${order.paymentStatus === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'}`}>
                                {order.paymentStatus === 'paid' ? 'Lunas' : order.paymentStatus === 'failed' ? 'Gagal' : order.paymentStatus === 'refunded' ? 'Dikembalikan' : 'Menunggu'}
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
                        <div className="px-4 py-2.5 border-b border-border/50 bg-muted/5">
                            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <ShoppingBag size={12} className="text-primary" /> Daftar Item
                            </h3>
                        </div>
                        <ul className="divide-y divide-border/50">
                            {formattedItems.map((item) => (
                                <li key={item.id} className="p-4 flex items-center hover:bg-muted/5 transition-colors group">
                                    <div className="w-12 h-12 bg-muted/5 rounded-lg border border-border/50 flex-shrink-0 mr-4 relative overflow-hidden">
                                        {item.productImage && item.productImage[0] ? (
                                            <Image src={item.productImage[0]} alt={item.productName || "Produk"} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground font-bold uppercase tracking-tight">N/A</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-foreground text-[11px] truncate uppercase tracking-tight">{item.productName || "Produk Tanpa Nama"}</h4>
                                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                            {formatPrice(item.price, currency)} × {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-sm font-bold text-foreground tracking-tight">
                                            {formatPrice(Number(item.price) * item.quantity, currency)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Customer & Actions */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-muted-foreground opacity-50">Data Pelanggan</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Nama</span>
                                <p className="text-sm font-bold text-foreground tracking-tight uppercase">{order.customerName}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Email</span>
                                <p className="text-[11px] font-medium text-foreground break-all">{order.customerEmail}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Alamat</span>
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                    {order.customerAddress || "Tidak tersedia"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status Manager */}
                    <OrderStatusManager
                        orderId={orderId}
                        paymentStatus={order.paymentStatus || "pending"}
                        fulfillmentStatus={order.fulfillmentStatus || "unfulfilled"}
                    />
                </div>
            </div>
        </div>
    );
}
