"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { ChevronDown, ChevronUp, Users } from "lucide-react";

interface ReferredUser {
    id: string;
    name: string | null;
    email: string | null;
    createdAt: Date | string;
}

interface Affiliate {
    id: string;
    name: string | null;
    email: string | null;
    referralCode: string | null;
    createdAt: Date | string;
    _count: {
        referrals: number;
    };
    referrals: ReferredUser[];
}

export default function AffiliateList({ data }: { data: Affiliate[] }) {
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6 text-foreground">
            <PageHeader
                title="Manajemen Afiliasi"
                subtitle="Pantau performa program referral dan pengguna yang diundang."
            />

            <TableContainer>
                <THead>
                    <TR>
                        <TH>Pengguna (Pengajak)</TH>
                        <TH>Kode Afiliasi</TH>
                        <TH>Total Diajak</TH>
                        <TH>Bergabung</TH>
                        <TH align="right">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {data.length === 0 && (
                        <TR>
                            <TD colSpan={5} align="center">
                                <div className="py-10 text-muted-foreground text-sm font-medium">
                                    Belum ada data pengguna yang berhasil mengundang orang lain.
                                </div>
                            </TD>
                        </TR>
                    )}
                    {data.map((aff) => (
                        <React.Fragment key={aff.id}>
                            <TR>
                                <TD>
                                    <p className="text-sm font-bold text-foreground">{aff.name || "Anonymous"}</p>
                                    <p className="text-[10px] text-muted-foreground">{aff.email}</p>
                                </TD>
                                <TD>
                                    <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        {aff.referralCode || "-"}
                                    </span>
                                </TD>
                                <TD>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={14} className="text-muted-foreground" />
                                        <span className="font-bold text-sm text-foreground">{aff._count.referrals}</span>
                                    </div>
                                </TD>
                                <TD>
                                    <p className="text-[11px] font-medium text-muted-foreground">
                                        {new Date(aff.createdAt).toLocaleDateString()}
                                    </p>
                                </TD>
                                <TD align="right">
                                    <button
                                        onClick={() => toggleRow(aff.id)}
                                        className="text-[10px] uppercase font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1 ml-auto"
                                    >
                                        Riwayat
                                        {expandedRows[aff.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                </TD>
                            </TR>
                            
                            {/* Expanded Row for Referral History */}
                            {expandedRows[aff.id] && (
                                <TR className="hover:bg-transparent">
                                    <TD colSpan={5} className="p-0 border-b border-border bg-muted/10" noWrap={false}>
                                        <div className="p-4 pl-10 border-l-2 border-primary/50 animate-in slide-in-from-top-2 duration-300 overflow-x-auto">
                                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-3">
                                                Riwayat Pengguna yang Diajak
                                            </h4>
                                            <div className="bg-background border border-border rounded-lg overflow-hidden min-w-[400px]">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-muted/30 border-b border-border">
                                                        <tr>
                                                            <th className="py-2 px-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Nama</th>
                                                            <th className="py-2 px-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Email</th>
                                                            <th className="py-2 px-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Tgl Daftar</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {aff.referrals.map(ref => (
                                                            <tr key={ref.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                                                <td className="py-2 px-4 font-medium text-foreground">{ref.name || "Anonymous"}</td>
                                                                <td className="py-2 px-4 text-muted-foreground">{ref.email}</td>
                                                                <td className="py-2 px-4 text-muted-foreground">
                                                                    {new Date(ref.createdAt).toLocaleDateString()} {new Date(ref.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TD>
                                </TR>
                            )}
                        </React.Fragment>
                    ))}
                </TBody>
            </TableContainer>
        </div>
    );
}
