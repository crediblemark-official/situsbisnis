"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, X, Copy, Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Portal from "@/components/ui/Portal";
import { isApexDomain } from "@/lib/domains/utils";
import { updateSiteCustomDomainAction, verifySiteCustomDomainAction } from "@/modules/auth";

interface DomainModalProps {
    isOpen: boolean;
    site: any;
    rootDomain: string;
    onClose: () => void;
    onDomainUpdated: (_customDomain: string | null, _customDomainVerified: boolean) => void;
}

export function DomainModal({ isOpen, site, rootDomain, onClose, onDomainUpdated }: DomainModalProps) {
    const [customDomain, setCustomDomain] = useState(site.customDomain || "");
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [modalError, setModalError] = useState("");
    const [modalSuccess, setModalSuccess] = useState("");
    const [copied, setCopied] = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);

    // Keyboard listeners for modal
    useEffect(() => {
        if (isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    onClose();
                }
            };
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isOpen, onClose]);

    const handleSaveDomain = async () => {
        setSaving(true);
        setModalError("");
        setModalSuccess("");

        try {
            const data = await updateSiteCustomDomainAction(site.id, customDomain || null);
            if (!data.success) {
                throw new Error(data.error || "Gagal menyimpan domain.");
            }

            onDomainUpdated(customDomain || null, false);
            setModalSuccess("Domain berhasil diperbarui! Silakan arahkan DNS Anda.");
        } catch (err: any) {
            setModalError(err.message || "Gagal menyimpan domain.");
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveDomain = async () => {
        if (!confirm("Apakah Anda yakin ingin menghapus domain kustom ini? Website Anda tidak akan bisa diakses lagi melalui domain ini.")) {
            return;
        }

        setSaving(true);
        setModalError("");
        setModalSuccess("");

        try {
            const data = await updateSiteCustomDomainAction(site.id, null);
            if (!data.success) {
                throw new Error(data.error || "Gagal menghapus domain.");
            }

            onDomainUpdated(null, false);
            setCustomDomain("");
            setModalSuccess("Domain kustom berhasil dihapus!");
        } catch (err: any) {
            setModalError(err.message || "Gagal menghapus domain.");
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyDns = async () => {
        if (!site.customDomain) return;
        setVerifying(true);
        setModalError("");
        setModalSuccess("");

        try {
            const data = await verifySiteCustomDomainAction(site.id, site.customDomain);
            if (!data.success) {
                throw new Error(data.error || "Proses verifikasi gagal.");
            }

            const result = data.result;
            if (result && result.status === "valid") {
                onDomainUpdated(site.customDomain, true);
                setModalSuccess("Domain berhasil diverifikasi dan aktif!");
            } else {
                setModalError(result?.message || "DNS belum terdeteksi. Silakan coba beberapa saat lagi.");
            }
        } catch (err: any) {
            setModalError(err.message || "Proses verifikasi gagal.");
        } finally {
            setVerifying(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isApex = site.customDomain && isApexDomain(site.customDomain);
    const cnameValue = `cname.${rootDomain}`;
    const serverIp = "168.231.119.22";

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    className="relative w-full max-w-xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 my-8 flex flex-col max-h-[90vh]"
                >
                    {/* Modal Header */}
                    <div className="p-6 border-b border-border/50 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest leading-none mb-1">
                                    Domain Kustom
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight leading-none opacity-60">
                                    Kelola domain kustom untuk {site.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all outline-none"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-grow no-scrollbar">
                        {/* Error/Success Messages */}
                        {modalError && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-3">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}
                        {modalSuccess && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-3">
                                <CheckCircle2 size={16} className="shrink-0" />
                                <span>{modalSuccess}</span>
                            </div>
                        )}

                        {/* Input Form */}
                        <div className="space-y-2">
                            <label htmlFor="custom-domain-input" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                Nama Domain
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    id="custom-domain-input"
                                    type="text"
                                    placeholder="domainanda.com atau subdomain.domainanda.com"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-sm font-mono outline-none focus:ring-1 focus:ring-primary"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSaveDomain}
                                        disabled={saving || customDomain.trim() === (site.customDomain || "")}
                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {saving && <Loader2 className="animate-spin" size={14} />}
                                        Simpan
                                    </button>
                                    {site.customDomain && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveDomain}
                                            disabled={saving}
                                            className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-500/25 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                        >
                                            {saving && <Loader2 className="animate-spin" size={14} />}
                                            Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="text-[9px] font-medium text-muted-foreground/80 leading-relaxed uppercase tracking-tight">
                                Masukkan nama domain kustom yang telah Anda beli. Pastikan untuk tidak memasukkan http:// atau https://.
                            </p>
                        </div>
 
                        {/* DNS Configuration Instructions */}
                        {site.customDomain && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                        Konfigurasi DNS
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleVerifyDns}
                                        disabled={verifying}
                                        className="px-4 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center gap-2"
                                    >
                                        {verifying && <Loader2 className="animate-spin" size={12} />}
                                        Verifikasi DNS
                                    </button>
                                </div>

                                <div className="bg-muted/30 border border-border rounded-2xl overflow-x-auto shadow-inner no-scrollbar">
                                    <table className="w-full text-left min-w-[500px]">
                                        <thead className="bg-muted/50 border-b border-border">
                                            <tr>
                                                <th className="px-5 py-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest">Tipe</th>
                                                <th className="px-5 py-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest">Host</th>
                                                <th className="px-5 py-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest">Value</th>
                                                <th className="px-5 py-3 text-[9px] font-black uppercase text-muted-foreground tracking-widest text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {isApex && (
                                                <tr className="text-xs font-mono group hover:bg-primary/5 transition-colors">
                                                    <td className="px-5 py-4 font-black text-blue-500">A</td>
                                                    <td className="px-5 py-4 opacity-70">@</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-foreground/80">{serverIp}</span>
                                                            <button 
                                                                onClick={() => handleCopy(serverIp)}
                                                                className={`p-1.5 rounded-lg transition-all ${
                                                                    copied ? 'bg-green-500/10 text-green-500' : 'bg-muted/50 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100'
                                                                }`}
                                                            >
                                                                {copied ? <Check size={12} /> : <Copy size={12} />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {site.customDomainVerified ? (
                                                            <div className="inline-flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Aktif
                                                            </div>
                                                        ) : (
                                                            <span className="text-[9px] font-black text-yellow-500 uppercase bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">Menunggu</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr className="text-xs font-mono group hover:bg-primary/5 transition-colors">
                                                <td className="px-5 py-4 font-black text-primary">CNAME</td>
                                                <td className="px-5 py-4 opacity-70">{isApex ? "www" : site.customDomain.split('.')[0]}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-foreground/80">{cnameValue}</span>
                                                        <button 
                                                            onClick={() => handleCopy(cnameValue)}
                                                            className={`p-1.5 rounded-lg transition-all ${
                                                                copied ? 'bg-green-500/10 text-green-500' : 'bg-muted/50 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100'
                                                            }`}
                                                        >
                                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {site.customDomainVerified ? (
                                                        <div className="inline-flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Aktif
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-yellow-500 uppercase bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">Menunggu</span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-muted/5 border-t border-border/50 flex justify-end gap-3 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-muted/10 text-foreground border border-border/50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/20 transition-all active:scale-95 outline-none"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
