"use client";

import React from "react";
import { CreditCard, CheckCircle2, AlertCircle, Clock, MoreHorizontal, FileText, RefreshCw, LayoutDashboard, PauseCircle, ArrowRight, MessageSquare } from "lucide-react";
import { TR, TD } from "@/components/ui/Table";

interface SubscriptionTableRowProps {
    sub: any;
    rootDomain: string;
    openDropdownId: string | null;
    setOpenDropdownId: (_id: string | null) => void;
    isUpdating: boolean;
    handleExtendSubscription: (_id: string) => void;
    setSubToCancel: (_sub: any) => void;
    setShowCancelModal: (_show: boolean) => void;
    setSelectedSub: (_sub: any) => void;
    isLast: boolean;
    onViewSites?: (_sub: any) => void;
    onFollowup?: (_sub: any) => void;
}

export function SubscriptionTableRow({
    sub,
    rootDomain,
    openDropdownId,
    setOpenDropdownId,
    isUpdating,
    handleExtendSubscription,
    setSubToCancel,
    setShowCancelModal,
    setSelectedSub,
    isLast,
    onViewSites,
    onFollowup
}: SubscriptionTableRowProps) {
    return (
        <TR>
            <TD>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
                        <CreditCard size={18} />
                    </div>
                    <div className="flex flex-col items-start">
                        {sub.site?.users && sub.site.users.length > 0 ? (
                            <>
                                <p className="text-sm font-bold text-foreground">
                                    {sub.site.users[0].name || "Tanpa Nama"}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-semibold">
                                    {sub.site.users[0].email}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-foreground">{sub.site?.name || "Deleted Site"}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                    {sub.site?.subdomain || "unknown"}.{rootDomain}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </TD>
            <TD>
                <div className="flex flex-col items-start gap-1">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        Paket {sub.plan?.name || "Tidak Diketahui"}
                        {sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date() && (
                            <span className="text-[8px] font-black text-sky-500 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-widest animate-pulse shrink-0">
                                Trial
                            </span>
                        )}
                    </p>
                    <button
                        onClick={() => onViewSites && onViewSites(sub)}
                        className="self-start text-left flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:border-primary/20 transition-all text-[9px] font-bold text-primary shadow-sm group"
                    >
                        <span>Batas: {sub.plan?.maxSites || 0}</span>
                        {sub.addonSlots > 0 && (
                            <span className="text-amber-500 font-extrabold">+ {sub.addonSlots}</span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        <span className="text-muted-foreground font-semibold pl-0.5 group-hover:underline">
                            ({sub.allSites?.length || 0} Situs)
                        </span>
                    </button>
                </div>
            </TD>
            <TD>
                <div className="flex items-center gap-2">
                    {sub.status === 'active' ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <CheckCircle2 size={10} />
                            <span className="text-[9px] font-bold uppercase">Aktif</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <AlertCircle size={10} />
                            <span className="text-[9px] font-bold uppercase">{sub.status.replace('_', ' ')}</span>
                        </div>
                    )}
                </div>
            </TD>
            <TD>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={12} />
                    <div className="flex flex-col">
                        <p className="text-xs font-medium text-foreground">
                            {new Date(sub.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-[9px] uppercase font-bold tracking-tighter">Tanggal Mulai</p>
                    </div>
                </div>
            </TD>
            <TD align="right">
                <div className="flex items-center justify-end gap-2 relative">
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === sub.id ? null : sub.id);
                            }}
                            className={`p-2 rounded-lg transition-all ${openDropdownId === sub.id ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                            <MoreHorizontal size={16} />
                        </button>

                        {openDropdownId === sub.id && (
                            <>
                                <div 
                                    className="fixed inset-0 z-[80]" 
                                    onClick={() => setOpenDropdownId(null)}
                                />
                                <div className={`absolute right-0 w-52 bg-card border border-border rounded-xl shadow-2xl z-[90] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ${
                                    isLast ? 'bottom-full mb-2' : 'mt-2'
                                }`}>
                                    <button 
                                        onClick={() => {
                                            alert("Fitur pembuatan faktur akan segera hadir");
                                            setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-foreground hover:bg-primary/5 hover:text-primary uppercase tracking-widest flex items-center gap-2.5 transition-colors"
                                    >
                                        <FileText size={14} className="text-muted-foreground" /> Lihat Faktur
                                    </button>
                                     <button 
                                        onClick={() => handleExtendSubscription(sub.id)}
                                        disabled={isUpdating}
                                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-foreground hover:bg-primary/5 hover:text-primary uppercase tracking-widest flex items-center gap-2.5 transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw size={14} className={`text-muted-foreground ${isUpdating ? 'animate-spin' : ''}`} /> Perpanjang Manual (+7 Hari)
                                    </button>
                                    <a 
                                        href={`http://${sub.site?.subdomain}.${rootDomain}/dashboard`}
                                        target="_blank"
                                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-foreground hover:bg-primary/5 hover:text-primary uppercase tracking-widest flex items-center gap-2.5 transition-colors"
                                    >
                                        <LayoutDashboard size={14} className="text-muted-foreground" /> Dashboard Situs
                                    </a>
                                    {onFollowup && (
                                        <button 
                                            onClick={() => {
                                                onFollowup(sub);
                                                setOpenDropdownId(null);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-foreground hover:bg-primary/5 hover:text-primary uppercase tracking-widest flex items-center gap-2.5 transition-colors"
                                        >
                                            <MessageSquare size={14} className="text-emerald-500" /> Hubungi / Followup WA
                                        </button>
                                    )}
                                    <div className="h-px bg-border my-1 mx-2" />
                                    <button 
                                        onClick={() => {
                                            setSubToCancel(sub);
                                            setShowCancelModal(true);
                                            setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[10px] font-bold text-destructive hover:bg-destructive/5 uppercase tracking-widest flex items-center gap-2.5 transition-colors"
                                    >
                                        <PauseCircle size={14} /> Batalkan/Tangguhkan
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <button 
                        onClick={() => setSelectedSub(sub)}
                        className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                        Kelola <ArrowRight size={12} />
                    </button>
                </div>
            </TD>
        </TR>
    );
}
