import React from "react";
import { Zap, Plus, Trash2 } from "lucide-react";

interface PlansTabProps {
    plans: any[];
    setPlans: (_plans: any[]) => void;
    addPlan: () => void;
    removePlan: (_id: string) => void;
    updatePlan: (_id: string, _data: Record<string, any>) => void;
}

export function PlansTab({
    plans,
    addPlan,
    removePlan,
    updatePlan
}: PlansTabProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <Zap size={16} className="text-primary" />
                        Daftar Paket & Harga
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-60">
                        Tentukan tingkat paket dan matriks fitur bagi pelanggan.
                    </p>
                </div>
                <button
                    onClick={addPlan}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={14} /> Tambah Paket Premium
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-card border border-border rounded-md shadow-2xl overflow-hidden group">
                        <div className="px-6 py-3 border-b border-border bg-muted/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">{plan.name || "Paket Tanpa Nama"}</h4>
                            </div>
                            <button
                                onClick={() => removePlan(plan.id)}
                                className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Basic Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor={`plan-name-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Nama Paket</label>
                                    <input
                                        id={`plan-name-${plan.id}`}
                                        type="text"
                                        value={plan.name || ""}
                                        onChange={(e) => updatePlan(plan.id, { name: e.target.value })}
                                        className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        placeholder="Gratis, Dasar, Pro..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-price-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Harga Bulanan</label>
                                        <input
                                            id={`plan-price-${plan.id}`}
                                            type="number"
                                            value={plan.price || 0}
                                            onChange={(e) => updatePlan(plan.id, { price: parseFloat(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-price-yearly-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Harga Tahunan</label>
                                        <input
                                            id={`plan-price-yearly-${plan.id}`}
                                            type="number"
                                            value={plan.priceYearly || 0}
                                            onChange={(e) => updatePlan(plan.id, { priceYearly: parseFloat(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor={`plan-addon-price-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Biaya Tambahan Slot Situs</label>
                                    <input
                                        id={`plan-addon-price-${plan.id}`}
                                        type="number"
                                        value={plan.features?.addonSitePrice || 0}
                                        onChange={(e) => {
                                            const newFeatures = { ...plan.features, addonSitePrice: parseFloat(e.target.value) };
                                            updatePlan(plan.id, { features: newFeatures });
                                        }}
                                        className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Resource Quotas */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-max-posts-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Maksimal Artikel</label>
                                        <input
                                            id={`plan-max-posts-${plan.id}`}
                                            type="number"
                                            value={plan.maxPosts || 0}
                                            onChange={(e) => updatePlan(plan.id, { maxPosts: parseInt(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-max-products-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Maksimal Produk</label>
                                        <input
                                            id={`plan-max-products-${plan.id}`}
                                            type="number"
                                            value={plan.maxProducts || 0}
                                            onChange={(e) => updatePlan(plan.id, { maxProducts: parseInt(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-max-assets-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Maksimal Aset / Media (MB)</label>
                                        <input
                                            id={`plan-max-assets-${plan.id}`}
                                            type="number"
                                            value={plan.maxAssets || 0}
                                            onChange={(e) => updatePlan(plan.id, { maxAssets: parseInt(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-max-testimonials-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Maksimal Testimoni</label>
                                        <input
                                            id={`plan-max-testimonials-${plan.id}`}
                                            type="number"
                                            value={plan.maxTestimonials || 0}
                                            onChange={(e) => updatePlan(plan.id, { maxTestimonials: parseInt(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`plan-max-sites-${plan.id}`} className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Slot Situs Utama</label>
                                        <input
                                            id={`plan-max-sites-${plan.id}`}
                                            type="number"
                                            value={plan.maxSites || 0}
                                            onChange={(e) => updatePlan(plan.id, { maxSites: parseInt(e.target.value) })}
                                            className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features Toggle */}
                            <div className="space-y-4">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Aktifkan Fitur Layanan</span>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {["hasBlog", "hasGallery", "hasOrders", "hasCart", "hasCustomDomain", "hasProducts", "hasPortfolio", "hasTaxonomies", "hasTestimonials", "hasInbox", "hasCustomers"].map((feat) => {
                                        const featureLabels: Record<string, string> = {
                                            hasBlog: "Blog",
                                            hasGallery: "Galeri",
                                            hasOrders: "Pesanan",
                                            hasCart: "Keranjang Belanja",
                                            hasCustomDomain: "Domain Kustom",
                                            hasProducts: "Produk",
                                            hasPortfolio: "Portofolio",
                                            hasTaxonomies: "Kategori & Tag",
                                            hasTestimonials: "Testimoni",
                                            hasInbox: "Kotak Masuk",
                                            hasCustomers: "Pelanggan"
                                        };
                                        return (
                                            <label key={feat} htmlFor={`feat-${feat}-${plan.id}`} className="flex items-center gap-3 cursor-pointer group/item">
                                                <div className="relative flex items-center">
                                                    <input
                                                        id={`feat-${feat}-${plan.id}`}
                                                        type="checkbox"
                                                        checked={plan.features?.[feat] === true || plan[feat] === true}
                                                        onChange={(e) => {
                                                            const newFeatures = { ...plan.features, [feat]: e.target.checked };
                                                            updatePlan(plan.id, { features: newFeatures, [feat]: e.target.checked });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-8 h-4 bg-muted border border-border rounded-full peer peer-checked:bg-primary/40 peer-checked:border-primary/60 transition-all"></div>
                                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-slate-400 rounded-full transition-all peer-checked:left-4.5 peer-checked:bg-primary shadow-sm"></div>
                                                </div>
                                                <span className="text-[9px] font-bold text-muted-foreground group-hover/item:text-foreground transition-colors uppercase tracking-widest">
                                                    {featureLabels[feat] || feat.replace("has", "")}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
