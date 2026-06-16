"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { Search, CheckCircle2, XCircle, Clock, Banknote, User, Copy, Check } from "lucide-react";

export default function WithdrawalList({ initialWithdrawals }: { initialWithdrawals: any[] }) {
    const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionTarget, setActionTarget] = useState<{ id: string, type: 'approved' | 'rejected' } | null>(null);

    const filtered = withdrawals.filter(w => {
        const matchSearch = (w.user?.name || "").toLowerCase().includes(search.toLowerCase()) ||
                            (w.user?.email || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || w.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const handleAction = async () => {
        if (!actionTarget) return;

        setIsUpdating(actionTarget.id);
        try {
            const res = await fetch("/api/admin/withdrawals/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    withdrawalId: actionTarget.id,
                    status: actionTarget.type
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setWithdrawals(prev => prev.map(w => w.id === updated.id ? { ...w, ...updated } : w));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsUpdating(null);
            setShowConfirmModal(false);
            setActionTarget(null);
        }
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6 text-foreground">
            <PageHeader
                title="Pencairan Dana (Withdrawals)"
                subtitle="Kelola permintaan pencairan saldo komisi dari para afiliator."
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                        <input
                            type="text"
                            placeholder="Cari pengguna..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-card border border-border rounded-md pl-8 pr-3 py-1.5 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-56"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-1.5 bg-card border border-border rounded-md text-[10px] font-bold uppercase outline-none focus:border-primary transition-all cursor-pointer"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </PageHeader>

            <TableContainer>
                <THead>
                    <TR>
                        <TH>Pengguna</TH>
                        <TH>Detail Rekening</TH>
                        <TH>Nominal</TH>
                        <TH>Tanggal Pengajuan</TH>
                        <TH>Status</TH>
                        <TH align="right">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {filtered.map((w) => (
                        <TR key={w.id}>
                            <TD>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{w.user?.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{w.user?.email}</p>
                                    </div>
                                </div>
                            </TD>
                            <TD>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-black uppercase text-foreground">{w.bankName}</span>
                                    <div className="flex items-center gap-1.5 font-mono">
                                        <span className="text-[10px] font-medium text-muted-foreground">{w.accountNumber}</span>
                                        <button
                                            onClick={() => handleCopy(w.id, w.accountNumber)}
                                            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                                            title="Salin Nomor Rekening"
                                        >
                                            {copiedId === w.id ? (
                                                <Check size={11} className="text-emerald-500 animate-in zoom-in duration-200" />
                                            ) : (
                                                <Copy size={11} className="transition-all" />
                                            )}
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">a.n {w.accountName}</span>
                                </div>
                            </TD>
                            <TD>
                                <span className="text-sm font-black text-foreground">Rp {Number(w.amount).toLocaleString("id-ID")}</span>
                            </TD>
                            <TD>
                                <p className="text-xs font-bold text-foreground">{new Date(w.createdAt).toLocaleDateString("id-ID")}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(w.createdAt).toLocaleTimeString("id-ID")}</p>
                            </TD>
                            <TD>
                                {w.status === 'approved' ? (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <CheckCircle2 size={10} />
                                        <span className="text-[9px] font-bold uppercase">Disetujui</span>
                                    </div>
                                ) : w.status === 'rejected' ? (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                                        <XCircle size={10} />
                                        <span className="text-[9px] font-bold uppercase">Ditolak</span>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-bold uppercase">Menunggu</span>
                                    </div>
                                )}
                            </TD>
                            <TD align="right">
                                {w.status === 'pending' && (
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setActionTarget({ id: w.id, type: 'rejected' });
                                                setShowConfirmModal(true);
                                            }}
                                            disabled={isUpdating === w.id}
                                            className="p-2 rounded-lg bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
                                            title="Tolak Penarikan"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActionTarget({ id: w.id, type: 'approved' });
                                                setShowConfirmModal(true);
                                            }}
                                            disabled={isUpdating === w.id}
                                            className="p-2 rounded-lg bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                                            title="Setujui Penarikan (Sudah Ditransfer)"
                                        >
                                            <CheckCircle2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </TD>
                        </TR>
                    ))}
                </TBody>
            </TableContainer>

            {filtered.length === 0 && (
                <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Banknote className="text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-bold text-foreground">Tidak ada pengajuan ditemukan</h4>
                </div>
            )}

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleAction}
                title={actionTarget?.type === 'approved' ? "Setujui Pencairan?" : "Tolak Pencairan?"}
                message={actionTarget?.type === 'approved'
                    ? "Pastikan Anda TELAH mentransfer dana ke rekening yang bersangkutan sebelum menekan Setujui. Saldo pengguna akan ditandai lunas."
                    : "Pencairan ini akan ditolak dan saldo akan dikembalikan ke dompet pengguna."}
                confirmText={actionTarget?.type === 'approved' ? "Ya, Sudah Ditransfer" : "Ya, Tolak"}
                variant={actionTarget?.type === 'approved' ? "primary" : "danger"}
            />
        </div>
    );
}
