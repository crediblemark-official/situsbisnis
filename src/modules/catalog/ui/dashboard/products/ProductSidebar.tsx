"use client";

import React from "react";
import { Package, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SidebarSection, SidebarField, SidebarInput } from "@/components/ui/Sidebar";

interface ProductSidebarProps {
    currency: string;
    symbol: string;
    price: string | number;
    onPriceChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
    originalPrice?: string | number;
    onOriginalPriceChange?: (_e: React.ChangeEvent<HTMLInputElement>) => void;
    stock: number;
    onStockChange: (_val: number) => void;
    slug: string;
    onSlugChange: (_val: string) => void;
    isEditing: boolean;
    onDelete: () => void;
    metaData: any[];
    onAddMetaData: () => void;
    onRemoveMetaData: (_idx: number) => void;
    onMetaDataChange: (_idx: number, _field: string, _value: string) => void;
    isDigital?: boolean;
}

export function ProductSidebar({
    currency,
    symbol,
    price,
    onPriceChange,
    originalPrice = "",
    onOriginalPriceChange,
    stock,
    onStockChange,
    slug,
    onSlugChange,
    isEditing,
    onDelete,
    metaData = [],
    onAddMetaData,
    onRemoveMetaData,
    onMetaDataChange,
    isDigital = false
}: ProductSidebarProps) {
    return (
        <div className="space-y-4">
            <SidebarSection title="Inventaris & Harga">
                <SidebarField label={`Harga (${currency})`} htmlFor="product-sidebar-price">
                    <SidebarInput
                        id="product-sidebar-price"
                        type="number"
                        value={price}
                        onChange={onPriceChange}
                        symbol={symbol}
                        placeholder="0"
                        step={currency === "IDR" ? "1" : "0.01"}
                        required
                    />
                </SidebarField>
                <SidebarField label={`Harga Coret (${currency})`} htmlFor="product-sidebar-original-price">
                    <SidebarInput
                        id="product-sidebar-original-price"
                        type="number"
                        value={originalPrice}
                        onChange={onOriginalPriceChange}
                        symbol={symbol}
                        placeholder="e.g. 75000"
                        step={currency === "IDR" ? "1" : "0.01"}
                    />
                </SidebarField>
                {isDigital ? (
                    <div className="space-y-1.5 opacity-90 animate-in fade-in duration-200">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block ml-1">Stok Tersedia</span>
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            <Package size={14} className="text-emerald-500 shrink-0 animate-pulse" />
                            <span>Unlimited (Digital)</span>
                        </div>
                    </div>
                ) : (
                    <SidebarField label="Stok Tersedia" htmlFor="product-sidebar-stock">
                        <SidebarInput
                            id="product-sidebar-stock"
                            type="number"
                            value={stock}
                            onChange={(e) => onStockChange(Number(e.target.value))}
                            icon={<Package size={12} />}
                            placeholder="0"
                        />
                    </SidebarField>
                )}
            </SidebarSection>

            <SidebarSection title="Spesifikasi / Detail" showDivider>
                <div className="space-y-2">
                    {metaData.map((meta: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 group/spec">
                            <div className="flex-1 grid grid-cols-5 gap-1">
                                <input
                                    type="text"
                                    value={meta.key}
                                    onChange={(e) => onMetaDataChange(idx, "key", e.target.value)}
                                    placeholder="e.g. Merek"
                                    className="col-span-2 px-1.5 py-1 bg-background border border-border/50 rounded text-[9px] font-semibold text-foreground focus:border-primary/50 outline-none shadow-sm placeholder:text-muted-foreground/30"
                                />
                                <input
                                    type="text"
                                    value={meta.value || ""}
                                    onChange={(e) => onMetaDataChange(idx, "value", e.target.value)}
                                    placeholder="e.g. Nike"
                                    className="col-span-3 px-1.5 py-1 bg-background border border-border/50 rounded text-[9px] font-semibold text-foreground focus:border-primary/50 outline-none shadow-sm placeholder:text-muted-foreground/30"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemoveMetaData(idx)}
                                className="p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                            >
                                <Trash2 size={10} />
                            </button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onAddMetaData}
                        icon={<Plus size={10} />}
                        className="w-full text-[8px] font-extrabold uppercase tracking-widest py-1 border border-dashed border-border flex items-center justify-center gap-1"
                    >
                        Spesifikasi
                    </Button>
                </div>
            </SidebarSection>

            <SidebarSection title="Tautan & SEO" showDivider>
                <SidebarField label="Slug Produk" htmlFor="product-sidebar-slug">
                    <SidebarInput
                        id="product-sidebar-slug"
                        type="text"
                        value={slug}
                        onChange={(e) => onSlugChange(e.target.value)}
                        className="font-mono text-[10px] text-primary"
                        required
                    />
                </SidebarField>
            </SidebarSection>

            {isEditing && (
                <div className="pt-3 border-t border-border/50">
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onDelete}
                        className="w-full"
                        icon={<Trash2 size={11} />}
                        size="sm"
                    >
                        Hapus Produk
                    </Button>
                </div>
            )}
        </div>
    );
}
