import React from "react";
import { Plus } from "lucide-react";

interface AddonSlotsProps {
    currentPlan: any;
    addonQty: number;
    setAddonQty: (_qty: number) => void;
    isLoading: boolean;
    onBuySlot: () => void;
}

export function AddonSlots({
    currentPlan,
    addonQty,
    setAddonQty,
    isLoading,
    onBuySlot
}: AddonSlotsProps) {
    if (!currentPlan || !(currentPlan.features?.addonSitePrice > 0)) return null;

    return (
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 relative overflow-hidden shadow-md group transition-all duration-500 hover:border-primary/20 bg-primary/[0.01]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                        <Plus className="text-primary" size={14} />
                        <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Tambah Slot Situs</h3>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium max-w-sm leading-relaxed opacity-70">
                        Tambah slot situs tambahan ke paket **{currentPlan.name}** Anda tanpa perlu upgrade paket utama.
                    </p>
                    {currentPlan.addonSlots > 0 && (
                        <div className="flex items-center gap-1 mt-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded w-fit animate-in zoom-in duration-300">
                            <span>{currentPlan.addonSlots} Slot Tambahan Aktif</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-background/50 p-2.5 rounded-xl border border-border/50">
                    <div className="text-center sm:text-right">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Harga Satuan</p>
                        <p className="text-md font-black text-foreground tracking-tighter uppercase leading-none">
                            Rp {Number(currentPlan.features.addonSitePrice).toLocaleString()}
                            <span className="text-[9px] opacity-40 ml-1">
                                {currentPlan.addonSiteBilling === "recurring" ? "/ bln" : "Sekali Bayar"}
                            </span>
                        </p>
                    </div>

                    <div className="h-6 w-[1px] bg-border/50 hidden sm:block" />

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Jumlah</p>
                            <div className="flex items-center bg-card border border-border rounded-md overflow-hidden">
                                <button
                                    onClick={() => setAddonQty(Math.max(1, addonQty - 1))}
                                    className="px-2 py-0.5 hover:bg-muted text-foreground transition-colors border-r border-border font-black text-xs"
                                >-</button>
                                <span className="px-3 py-0.5 text-[9px] font-black text-foreground min-w-[24px] text-center">{addonQty}</span>
                                <button
                                    onClick={() => setAddonQty(addonQty + 1)}
                                    className="px-2 py-0.5 hover:bg-muted text-foreground transition-colors border-l border-border font-black text-xs"
                                >+</button>
                            </div>
                        </div>

                        <button
                            onClick={onBuySlot}
                            disabled={isLoading}
                            className="bg-primary text-primary-foreground px-3.5 py-2 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] hover:scale-102 transition-all shadow-sm shadow-primary/20 disabled:opacity-50"
                        >
                            {isLoading ? "..." : "Beli Slot"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
