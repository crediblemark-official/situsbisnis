"use client";

import React, { useState } from "react";
import { Save, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateOrderFulfillmentAction } from "@/modules/order/actions/order.actions";

export default function OrderStatusManager({ orderId, paymentStatus, fulfillmentStatus }: { orderId: string, paymentStatus: string, fulfillmentStatus: string }) {
    const [pStatus, setPStatus] = useState(paymentStatus);
    const [fStatus, setFStatus] = useState(fulfillmentStatus);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const res = await updateOrderFulfillmentAction(orderId, {
                paymentStatus: pStatus,
                fulfillmentStatus: fStatus
            });

            if (res.success) {
                router.refresh();
                toast.success("Status pesanan diperbarui");
            } else {
                toast.error(res.error || "Gagal memperbarui status");
            }
        } catch (e) {
            console.error(e);
            toast.error("Terjadi kesalahan saat memperbarui status");
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanges = pStatus !== paymentStatus || fStatus !== fulfillmentStatus;

    return (
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
                <RefreshCw size={12} className="text-primary" />
                <h3 className="text-[10px] font-black text-foreground">Kelola Status</h3>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="order-payment-status" className="text-[9px] font-bold text-muted-foreground ml-0.5">Status Pembayaran</label>
                    <select
                        id="order-payment-status"
                        value={pStatus}
                        onChange={(e) => setPStatus(e.target.value)}
                        className="appearance-none w-full px-3 py-2 bg-background border border-border/50 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary/50 outline-none text-foreground transition-all font-bold text-[11px] tracking-tight cursor-pointer"
                    >
                        <option value="pending">Menunggu Pembayaran</option>
                        <option value="paid">Sudah Dibayar</option>
                        <option value="failed">Gagal</option>
                        <option value="refunded">Dikembalikan</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="order-shipping-status" className="text-[9px] font-bold text-muted-foreground ml-0.5">Status Pengiriman</label>
                    <select
                        id="order-shipping-status"
                        value={fStatus}
                        onChange={(e) => setFStatus(e.target.value)}
                        className="appearance-none w-full px-3 py-2 bg-background border border-border/50 rounded-lg focus:ring-1 focus:ring-primary/20 focus:border-primary/50 outline-none text-foreground transition-all font-bold text-[11px] tracking-tight cursor-pointer"
                    >
                        <option value="unfulfilled">Belum Diproses</option>
                        <option value="shipped">Dalam Pengiriman</option>
                        <option value="delivered">Sudah Diterima</option>
                        <option value="returned">Dikembalikan</option>
                        <option value="cancelled">Dibatalkan</option>
                    </select>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleUpdate}
                        disabled={isLoading || !hasChanges}
                        className="w-full px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed font-black text-[10px] transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isLoading ? "Menyimpan..." : "Perbarui Status"}
                    </button>
                </div>
            </div>
        </div>
    );
}
