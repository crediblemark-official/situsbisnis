import { db } from "@/lib/core/db";
import Link from "next/link";
import { Eye, Package, MessageSquare, CreditCard, Building2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serializeOrders } from "@/lib/content/serialize";
import { getPaymentSettings } from "@/lib/settings/payment";
import { getSiteId } from "@/lib/domains/tenant";
import { formatPrice } from "@/lib/billing/currency";
import { PageHeader } from "@/components/ui/PageHeader";
import { 
    TableContainer, 
    THead, 
    TBody, 
    TR, 
    TH, 
    TD 
} from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

export const revalidate = 0; // Ensure fresh data

export default async function OrderListPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; limit?: string }>;
}) {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role || "user";
    const userEmail = session?.user?.email;
    const { page, limit } = await searchParams;
    const currentPage = parseInt(page || "1");
    const pageSize = parseInt(limit || "50");
    const skip = (currentPage - 1) * pageSize;

    const paymentSettings = await getPaymentSettings();
    const currency = paymentSettings.currency || "USD";

    const siteId = await getSiteId();
    const whereCondition: any = { siteId };
    if (userRole !== "admin") {
        whereCondition.customerEmail = userEmail || "";
    }

    const [orderListRaw, total] = await Promise.all([
        db.order.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: pageSize,
            skip: skip,
            select: {
                id: true,
                customerName: true,
                customerEmail: true,
                total: true,
                status: true,
                paymentStatus: true,
                createdAt: true,
                siteId: true,
                paymentMethod: true,
            }
        }),
        db.order.count({ where: whereCondition })
    ]);

    const orderList = serializeOrders(orderListRaw);
    const totalPages = Math.ceil(total / pageSize);


    return (
        <div className="animate-in fade-in duration-700 pb-20 space-y-10">
            <PageHeader 
                title="Pesanan" 
                subtitle="Kelola transaksi dan riwayat pesanan pelanggan." 
                icon={<Package />}
            />

            <TableContainer>
                <THead>
                    <TR>
                        <TH>ID Pesanan</TH>
                        <TH>Pelanggan</TH>
                        <TH>Tanggal</TH>
                        <TH align="center">Status</TH>
                        <TH>Total</TH>
                        <TH align="right">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {orderList.length === 0 ? (
                        <TR>
                            <TD colSpan={6} className="py-32">
                                <EmptyState 
                                    icon={<Package size={32} />} 
                                    message="Belum ada pesanan masuk." 
                                />
                            </TD>
                        </TR>
                    ) : (
                        orderList.map((order) => (
                            <TR key={order.id} className="group/row">
                                <TD className="font-mono text-[10px] text-primary/60 font-black tracking-tighter">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </TD>
                                <TD>
                                    <div className="text-[11px] font-black text-foreground tracking-tight uppercase group-hover/row:text-primary transition-colors">{order.customerName}</div>
                                    <div className="text-[9px] text-muted-foreground mt-0.5 font-medium opacity-60 italic">{order.customerEmail}</div>
                                </TD>
                                <TD className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                    {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </TD>
                                <TD align="center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <StatusBadge 
                                            type={
                                                order.paymentStatus === 'paid' ? 'success' : 
                                                order.paymentStatus === 'failed' ? 'error' : 
                                                'warning'
                                            } 
                                            label={order.paymentStatus === 'paid' ? 'Terbayar' : order.paymentStatus || 'Menunggu'} 
                                        />
                                        {order.paymentMethod === 'whatsapp' ? (
                                            <span className="p-1 rounded-[4px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 inline-flex" title="Transaksi via WhatsApp">
                                                <MessageSquare size={10} />
                                            </span>
                                        ) : order.paymentMethod === 'manual' ? (
                                            <span className="p-1 rounded-[4px] bg-purple-500/10 text-purple-400 border border-purple-500/20 inline-flex" title="Transfer Bank Manual">
                                                <Building2 size={10} />
                                            </span>
                                        ) : (
                                            <span className="p-1 rounded-[4px] bg-blue-500/10 text-blue-400 border border-blue-500/20 inline-flex" title="Pembayaran Otomatis (Gateway)">
                                                <CreditCard size={10} />
                                            </span>
                                        )}
                                    </div>
                                </TD>
                                <TD className="text-[11px] font-black text-foreground tracking-tight">
                                    {formatPrice(order.total, currency)}
                                </TD>
                                <TD align="right">
                                    <div className="flex justify-end gap-2 items-center lg:opacity-40 lg:group-hover/row:opacity-100 opacity-100 transition-opacity">
                                        <Link href={`/dashboard/orders/${order.id}`} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title="View Detail">
                                            <Eye size={16} />
                                        </Link>
                                    </div>
                                </TD>
                            </TR>
                        ))
                    )}
                </TBody>
            </TableContainer>

            <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
    );
}
