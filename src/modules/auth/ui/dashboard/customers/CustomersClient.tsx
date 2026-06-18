"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { 
    TableContainer, 
    THead, 
    TBody, 
    TR, 
    TH, 
    TD 
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/Stats";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Users, Search, Calendar, DollarSign, MapPin, Phone, X, Copy, Check, ExternalLink, MessageSquare } from "lucide-react";
import Portal from "@/components/ui/Portal";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/billing/currency";

type CustomerType = {
    name: string;
    email: string;
    address: string;
    totalSpent: number;
    orderCount: number;
    lastOrderDate: string;
    hasPaidOrder: boolean;
};

type Props = {
    initialCustomers: CustomerType[];
    currency: string;
    totalRevenue: number;
};

// Fungsi pembantu untuk mengekstrak nomor HP/WhatsApp dari alamat pengiriman
function parsePhoneFromAddress(address: string): string | null {
    if (!address) return null;
    const match = address.match(/\(WA\/Telp:\s*([^\)]+)\)/i);
    if (match) return match[1].trim();
    return null;
}

// Fungsi pembantu untuk membersihkan string alamat dari bagian WA/Telp
function cleanAddress(address: string): string {
    if (!address) return "";
    return address.replace(/\s*\(WA\/Telp:\s*[^\)]+\)/i, '').trim();
}

// Fungsi pembantu untuk membersihkan format nomor WhatsApp agar siap digunakan di API wa.me
function cleanPhoneForWhatsApp(phone: string): string {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
        clean = '62' + clean.substring(1);
    }
    return clean;
}

export default function CustomersClient({ initialCustomers, currency, totalRevenue }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Kunci scroll body saat modal terbuka
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isModalOpen]);

    // Tutup modal dengan tombol Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Filter pelanggan secara instan berdasarkan input pencarian
    const filteredCustomers = initialCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
    );



    // Kalkulasi pagination
    const pageSize = 15;
    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    const paginatedCustomers = filteredCustomers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Hitung statistik ringkasan statis (seluruh data pembeli)
    const totalCustomers = initialCustomers.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeCustomersCount = initialCustomers.filter(c => 
        new Date(c.lastOrderDate) >= thirtyDaysAgo
    ).length;

    const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Fungsi untuk menyalin teks ke clipboard
    const copyToClipboard = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success(`${fieldName} berhasil disalin!`);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleOpenAddress = (customer: CustomerType) => {
        setSelectedCustomer(customer);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6">
            <PageHeader 
                title="Pelanggan" 
                subtitle="Lihat dan kelola profil pembeli serta riwayat belanja mereka." 
                icon={<Users />}
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Pelanggan"
                    value={totalCustomers}
                    icon={<Users size={20} />}
                    description="Pelanggan unik terdaftar"
                />
                <StatCard
                    title="Pelanggan Aktif"
                    value={activeCustomersCount}
                    icon={<Calendar size={20} />}
                    description="Bertransaksi 30 hari terakhir"
                />
                <StatCard
                    title="Rata-rata Belanja"
                    value={formatPrice(averageSpending, currency)}
                    icon={<DollarSign size={20} />}
                    description="Rata-rata transaksi sukses"
                />
                <StatCard
                    title="Total Pendapatan"
                    value={formatPrice(totalRevenue, currency)}
                    icon={<MessageSquare size={20} />}
                    description="Akumulasi seluruh transaksi sukses"
                />
            </div>

            <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Daftar Pelanggan</h3>
                    <div className="w-full max-w-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={14} aria-hidden="true" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Cari pelanggan berdasarkan nama, email, alamat..."
                                className="w-full pl-9 pr-8 py-1.5 bg-muted/10 border border-border rounded-lg text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium placeholder:text-muted-foreground/50"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => {
                                        setSearchTerm("");
                                        setCurrentPage(1);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary hover:opacity-80 uppercase tracking-widest outline-none"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <TableContainer>
                    <THead>
                        <TR>
                            <TH>Pelanggan</TH>
                            <TH align="center">Tipe</TH>
                            <TH>No. WhatsApp / HP</TH>
                            <TH>Alamat Terakhir</TH>
                            <TH align="center">Jumlah Pesanan</TH>
                            <TH>Total Belanja</TH>
                            <TH align="center">Pesanan Terakhir</TH>
                            <TH align="right">Aksi</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {paginatedCustomers.length === 0 ? (
                            <TR>
                                <TD colSpan={8} className="py-24">
                                    <EmptyState 
                                        icon={<Users size={36} className="opacity-40" />} 
                                        message={searchTerm ? "Pelanggan tidak ditemukan untuk pencarian ini." : "Belum ada data pelanggan masuk."} 
                                    />
                                </TD>
                            </TR>
                        ) : (
                            paginatedCustomers.map((customer) => {
                                const phone = parsePhoneFromAddress(customer.address);
                                const addressCleaned = cleanAddress(customer.address);
                                const waUrl = phone ? `https://wa.me/${cleanPhoneForWhatsApp(phone)}` : null;

                                return (
                                    <TR key={customer.email} className="group/row">
                                        {/* Nama & Email */}
                                        <TD>
                                            <div className="flex items-center gap-3 py-1">
                                                <div className="w-9 h-9 rounded-2xl bg-muted/5 flex items-center justify-center border border-border group-hover/row:border-primary/50 transition-all relative overflow-hidden shadow-inner">
                                                    <span className="font-black text-xs text-muted-foreground/60 uppercase">
                                                        {customer.name.slice(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-foreground tracking-tight uppercase group-hover/row:text-primary transition-colors">
                                                        {customer.name}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground mt-0.5 font-medium opacity-65 italic">
                                                        {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TD>

                                        {/* Tipe / Status */}
                                        <TD align="center">
                                            <StatusBadge 
                                                type={customer.hasPaidOrder ? "success" : "secondary"} 
                                                label={customer.hasPaidOrder ? "Pelanggan" : "Lead"} 
                                            />
                                        </TD>

                                        {/* No WhatsApp */}
                                        <TD>
                                            {phone ? (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">
                                                    <Phone size={12} className="text-emerald-500" />
                                                    <span>{phone}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase text-muted-foreground/45 tracking-widest">
                                                    Tidak Ada
                                                </span>
                                            )}
                                        </TD>

                                        {/* Alamat Terakhir (Truncated & Clickable) */}
                                        <TD className="max-w-[180px]">
                                            {addressCleaned && addressCleaned !== "No Address Provided" ? (
                                                <div 
                                                    onClick={() => handleOpenAddress(customer)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer w-full group/addr"
                                                    title="Klik untuk melihat alamat lengkap"
                                                >
                                                    <MapPin size={12} className="text-primary/60 flex-shrink-0 group-hover/addr:scale-110 transition-transform" />
                                                    <span className="truncate underline decoration-dotted decoration-muted-foreground/30 hover:decoration-primary">
                                                        {addressCleaned}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase text-muted-foreground/45 tracking-widest">
                                                    Tidak Ada
                                                </span>
                                            )}
                                        </TD>

                                        {/* Jumlah Pesanan */}
                                        <TD align="center">
                                            <span className="px-2.5 py-1 bg-muted/10 border border-border/40 rounded-lg text-[10px] font-bold text-foreground">
                                                {customer.orderCount}x
                                            </span>
                                        </TD>

                                        {/* Total Belanja */}
                                        <TD className="text-[11px] font-black text-foreground tracking-tight">
                                            {formatPrice(customer.totalSpent, currency)}
                                        </TD>

                                        {/* Tanggal Pesanan Terakhir */}
                                        <TD align="center" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                            {new Date(customer.lastOrderDate).toLocaleDateString("id-ID", { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </TD>

                                        {/* Aksi */}
                                        <TD align="right">
                                            <div className="flex justify-end gap-2 items-center lg:opacity-40 lg:group-hover/row:opacity-100 opacity-100 transition-opacity">
                                                {waUrl && (
                                                    <a 
                                                        href={waUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 hover:border-emerald-500 transition-all flex items-center gap-1.5 shadow-sm hover:shadow-emerald-500/20 active:scale-95"
                                                        title="Hubungi via WhatsApp"
                                                    >
                                                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                        </svg>
                                                        Hubungi
                                                    </a>
                                                )}
                                            </div>
                                        </TD>
                                    </TR>
                                );
                            })
                        )}
                    </TBody>
                </TableContainer>

                {/* Local Client-Side Pagination */}
                {totalPages > 1 && (
                    <nav aria-label="Pagination" className="mt-10 flex justify-center items-center gap-6">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage <= 1}
                            className={`
                                px-6 py-2 bg-muted/10 border border-border rounded-xl 
                                text-[10px] font-black uppercase tracking-[0.2em] text-foreground 
                                transition-all outline-none 
                                focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50
                                ${currentPage <= 1 
                                    ? 'opacity-30 pointer-events-none' 
                                    : 'hover:bg-muted/20 active:scale-95 cursor-pointer'
                                }
                            `}
                        >
                            Kembali
                        </button>
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                            Halaman {currentPage} <span className="opacity-30">/</span> {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage >= totalPages}
                            className={`
                                px-6 py-2 bg-muted/10 border border-border rounded-xl 
                                text-[10px] font-black uppercase tracking-[0.2em] text-foreground 
                                transition-all outline-none 
                                focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50
                                ${currentPage >= totalPages 
                                    ? 'opacity-30 pointer-events-none' 
                                    : 'hover:bg-muted/20 active:scale-95 cursor-pointer'
                                }
                            `}
                        >
                            Lanjut
                        </button>
                    </nav>
                )}
            </div>

            {/* Sidebar Slide-over Modal for Customer Address Details */}
            {isModalOpen && selectedCustomer && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                        {/* Overlay backdrop click */}
                        <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
                        
                        {/* Modal Body */}
                        <div className="w-full max-w-md h-screen bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out relative z-10">
                            {/* Header Area */}
                            <div className="relative px-6 py-5 border-b border-border bg-muted/5">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60"></div>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                            <MapPin size={20} className="text-primary" /> Detail Alamat
                                        </h3>
                                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-1">
                                            Informasi Lengkap Pelanggan
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsModalOpen(false)} 
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-all outline-none"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                                {/* Profil Card */}
                                <div className="p-4 bg-muted/10 border border-border/55 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-base">
                                        {selectedCustomer.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-foreground text-sm uppercase tracking-tight leading-none mb-1.5">
                                            {selectedCustomer.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge 
                                                type={selectedCustomer.hasPaidOrder ? "success" : "secondary"} 
                                                label={selectedCustomer.hasPaidOrder ? "Pelanggan" : "Lead"} 
                                            />
                                            <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">
                                                {selectedCustomer.orderCount} Pesanan
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Kontak Details */}
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-1.5">Kontak & Identitas</h5>
                                    
                                    {/* Email */}
                                    <div className="flex justify-between items-start gap-4 p-3 bg-muted/5 border border-border/30 rounded-xl">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Email</span>
                                            <p className="text-xs font-semibold text-foreground break-all">{selectedCustomer.email}</p>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(selectedCustomer.email, "Email")}
                                            className="p-1.5 bg-muted/10 hover:bg-primary/10 border border-border hover:border-primary/20 text-muted-foreground hover:text-primary rounded-lg transition-all outline-none"
                                            title="Salin Email"
                                        >
                                            {copiedField === "Email" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                        </button>
                                    </div>

                                    {/* No HP / WhatsApp */}
                                    {parsePhoneFromAddress(selectedCustomer.address) && (
                                        <div className="flex justify-between items-start gap-4 p-3 bg-muted/5 border border-border/30 rounded-xl">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Nomor WhatsApp / HP</span>
                                                <p className="text-xs font-semibold text-foreground">{parsePhoneFromAddress(selectedCustomer.address)}</p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button 
                                                    onClick={() => copyToClipboard(parsePhoneFromAddress(selectedCustomer.address) || "", "Nomor WhatsApp")}
                                                    className="p-1.5 bg-muted/10 hover:bg-primary/10 border border-border hover:border-primary/20 text-muted-foreground hover:text-primary rounded-lg transition-all outline-none"
                                                    title="Salin Nomor WhatsApp"
                                                >
                                                    {copiedField === "Nomor WhatsApp" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                </button>
                                                {parsePhoneFromAddress(selectedCustomer.address) && (
                                                    <a 
                                                        href={`https://wa.me/${cleanPhoneForWhatsApp(parsePhoneFromAddress(selectedCustomer.address) || "")}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-700 hover:text-white rounded-lg transition-all outline-none flex items-center justify-center"
                                                        title="Buka Chat WhatsApp"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Alamat Lengkap */}
                                <div className="space-y-4">
                                    <h5 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-1.5">Alamat Pengiriman</h5>
                                    
                                    <div className="p-4 bg-muted/5 border border-border/40 rounded-xl space-y-3 relative group">
                                        <div className="absolute top-3.5 right-3.5">
                                            <button 
                                                onClick={() => copyToClipboard(cleanAddress(selectedCustomer.address), "Alamat Lengkap")}
                                                className="p-1.5 bg-muted/10 hover:bg-primary/10 border border-border hover:border-primary/20 text-muted-foreground hover:text-primary rounded-lg transition-all outline-none"
                                                title="Salin Alamat Lengkap"
                                            >
                                                {copiedField === "Alamat Lengkap" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1 pr-6">
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">Alamat Terakhir</span>
                                                <p className="text-xs font-medium text-foreground leading-relaxed break-words whitespace-pre-line">
                                                    {cleanAddress(selectedCustomer.address) || "Alamat tidak tersedia"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Area */}
                            <div className="px-6 py-5 border-t border-border bg-muted/5">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full py-2.5 bg-muted/10 hover:bg-muted/20 border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:scale-[1.01] active:scale-[0.99] outline-none"
                                >
                                    Tutup Detail
                                </button>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
}
