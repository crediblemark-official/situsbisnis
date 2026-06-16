import React from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, PenTool, ImageIcon, ShoppingCart, Globe, Package, Layout, Tags, Heart, Mail, Upload, FileText } from "lucide-react";
import { isFeatureEnabled } from "@/lib/billing/features";
import { Plan } from "./types";

interface FeaturesMatrixProps {
    previewPlan: Plan | null;
}

export function FeaturesMatrix({ previewPlan }: FeaturesMatrixProps) {
    const featuresList = [
        { label: "Sistem Blog", key: "hasBlog", icon: <PenTool size={14} /> },
        { label: "Galeri Foto", key: "hasGallery", icon: <ImageIcon size={14} /> },
        { label: "Manajemen Pesanan", key: "hasOrders", icon: <ShoppingCart size={14} /> },
        { label: "Keranjang Belanja", key: "hasCart", icon: <ShoppingCart size={14} /> },
        { label: "Domain Kustom", key: "hasCustomDomain", icon: <Globe size={14} /> },
        { label: "Katalog Produk", key: "hasProducts", icon: <Package size={14} /> },
        { label: "Portofolio", key: "hasPortfolio", icon: <Layout size={14} /> },
        { label: "Kategori & Tag", key: "hasTaxonomies", icon: <Tags size={14} /> },
        { label: "Testimoni", key: "hasTestimonials", icon: <Heart size={14} /> },
        { label: "Kotak Pesan", key: "hasInbox", icon: <Mail size={14} /> },
        { label: "Kuota Artikel", key: "maxPosts", icon: <FileText size={14} />, isResource: true },
        { label: "Kuota Produk", key: "maxProducts", icon: <Package size={14} />, isResource: true },
        { label: "Kuota Unggah", key: "maxAssets", icon: <Upload size={14} />, isResource: true },
        { label: "Kuota Testimoni", key: "maxTestimonials", icon: <Heart size={14} />, isResource: true },
        { label: "Slot Situs Utama", key: "maxSites", icon: <Globe size={14} />, isResource: true },
    ];

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md transition-all duration-500 hover:border-primary/10">
            <div className="px-4 py-2.5 border-b border-border bg-muted/10 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" />
                    Fitur Layanan {previewPlan?.name && `- ${previewPlan.name}`}
                </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                {featuresList.map((feat) => {
                    const isEnabled = feat.isResource
                        ? ((previewPlan as any)?.[feat.key] ?? -1) !== 0
                        : isFeatureEnabled(previewPlan?.name || "", previewPlan?.features, feat.key);

                    const resourceValue = feat.isResource
                        ? (previewPlan as any)?.[feat.key] === -1 ? "Tanpa Batas" : (previewPlan as any)?.[feat.key] || "0"
                        : null;

                    return (
                        <div key={feat.key} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 group">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-1 rounded-lg transition-all duration-500 ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/30'}`}>
                                    {React.cloneElement(feat.icon as React.ReactElement<any>, { size: 11 })}
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${isEnabled ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                                    {feat.label}
                                </span>
                            </div>
                            {feat.isResource ? (
                                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 animate-in zoom-in duration-300">
                                    {resourceValue}
                                </span>
                            ) : isEnabled ? (
                                <div className="p-0.5 rounded-full bg-green-500/10 animate-in zoom-in duration-300">
                                    <CheckCircle2 size={12} className="text-green-500 shadow-sm" />
                                </div>
                            ) : (
                                <div className="p-0.5 rounded-full bg-muted/10">
                                    <AlertCircle size={12} className="text-muted-foreground/20" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Trial Policy Information */}
            <div className="p-4 bg-muted/5 border-t border-border space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        Kebijakan Masa Uji Coba
                    </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">1. Akses Penuh</p>
                        <p className="text-[8px] text-muted-foreground font-medium leading-tight">Gunakan fitur Premium gratis selama 14 hari.</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">2. Tanpa Kartu</p>
                        <p className="text-[8px] text-muted-foreground font-medium leading-tight">Daftar cukup email, tanpa penagihan otomatis.</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">3. Ekstensi</p>
                        <p className="text-[8px] text-muted-foreground font-medium leading-tight">Perpanjang masa trial +7 hari secara gratis.</p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">4. Masa Tenggang</p>
                        <p className="text-[8px] text-muted-foreground font-medium leading-tight">Situs offline setelah trial, data aman 30 hari.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
