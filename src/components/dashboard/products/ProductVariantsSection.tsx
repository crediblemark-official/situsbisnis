"use client";

import React from "react";
import { Trash2, Plus, X } from "lucide-react";
import { FormSection } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";

interface VariantOption {
    name: string;
    values: string[];
}

interface VariantItem {
    name: string;
    price: string | number;
    stock: number;
    sku: string;
    attributes: Record<string, string>;
}

interface ProductVariantsSectionProps {
    hasVariants: boolean;
    setHasVariants: (_val: boolean) => void;
    variantOptions: VariantOption[];
    variantItems: VariantItem[];
    addVariantOption: () => void;
    removeVariantOption: (_idx: number) => void;
    updateVariantOption: (_idx: number, _name: string) => void;
    addVariantValue: (_idx: number, _value: string) => void;
    removeVariantValue: (_optIdx: number, _valIdx: number) => void;
    updateVariantItem: (_idx: number, _field: string, _value: any) => void;
    currency: string;
    symbol: string;
}

export function ProductVariantsSection({
    hasVariants,
    setHasVariants,
    variantOptions,
    variantItems,
    addVariantOption,
    removeVariantOption,
    updateVariantOption,
    addVariantValue,
    removeVariantValue,
    updateVariantItem,
    currency,
    symbol
}: ProductVariantsSectionProps) {
    return (
        <FormSection 
            title="Varian Produk" 
            description="Aktifkan fitur varian jika produk ini memiliki pilihan seperti ukuran atau warna."
        >
            <div className="space-y-6">
                <div className="flex items-center gap-3 p-3 bg-muted/5 rounded-md border border-border/50">
                    <div className="flex-1">
                        <h4 className="text-[10px] font-bold text-foreground">Aktifkan Varian</h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5">Produk ini memiliki berbagai pilihan (Warna, Ukuran, dll)</p>
                    </div>
                    <Switch
                        checked={hasVariants}
                        onChange={setHasVariants}
                    />
                </div>

                {hasVariants && (
                    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                        <div className="space-y-4">
                            {variantOptions.map((opt, optIdx) => (
                                <div key={optIdx} className="p-3 bg-muted/5 rounded-md border border-border/50 space-y-4 relative group/opt">
                                    <div className="flex items-end gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label htmlFor={`variant-option-${optIdx}`} className="text-[9px] font-bold text-muted-foreground ml-1">Nama Opsi</label>
                                            <input 
                                                id={`variant-option-${optIdx}`}
                                                value={opt.name}
                                                onChange={(e) => updateVariantOption(optIdx, e.target.value)}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-md text-[10px] font-bold outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            onClick={() => removeVariantOption(optIdx)}
                                            className="h-9 w-9 p-0"
                                            icon={<Trash2 size={16} />}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor={`variant-values-${optIdx}`} className="text-[9px] font-bold text-muted-foreground ml-1">Nilai Varian</label>
                                        <div className="flex flex-wrap gap-2 p-2 bg-background border border-border rounded-md min-h-[40px]">
                                            {opt.values.map((val: string, valIdx: number) => (
                                                <span key={valIdx} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded border border-primary/20">
                                                    {val}
                                                    <button type="button" onClick={() => removeVariantValue(optIdx, valIdx)}><X size={10} /></button>
                                                </span>
                                            ))}
                                            <input 
                                                className="flex-1 bg-transparent border-none outline-none text-[10px] font-medium min-w-[100px]"
                                                placeholder="Tambah nilai..."
                                                onKeyDown={(e: any) => {
                                                    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
                                                        e.preventDefault();
                                                        addVariantValue(optIdx, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                                onBlur={(e: any) => {
                                                    if (e.target.value.trim()) {
                                                        addVariantValue(optIdx, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button 
                                type="button"
                                variant="secondary"
                                onClick={addVariantOption}
                                className="w-full border-2 border-dashed"
                                icon={<Plus size={14} />}
                            >
                                Tambah Opsi Varian
                            </Button>
                        </div>

                        {variantItems.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <h4 className="text-[10px] font-bold text-foreground">Daftar Variasi Produk</h4>
                                    <span className="text-[9px] font-bold text-muted-foreground bg-muted/10 px-2 py-0.5 rounded-full">{variantItems.length} Kombinasi</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-separate border-spacing-y-2">
                                        <thead>
                                            <tr className="text-[9px] font-bold text-muted-foreground text-left">
                                                <th className="px-4 py-2">Variasi</th>
                                                <th className="px-4 py-2">Harga ({currency})</th>
                                                <th className="px-4 py-2 w-24">Stok</th>
                                                <th className="px-4 py-2">SKU</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variantItems.map((item, idx) => (
                                                <tr key={idx} className="bg-muted/5 group hover:bg-muted/10 transition-colors">
                                                    <td className="px-4 py-2 rounded-l-md border-y border-l border-border/50">
                                                        <span className="text-[10px] font-bold text-foreground">{item.name}</span>
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-border/50">
                                                        <div className="relative w-32">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground opacity-50">{symbol}</span>
                                                            <input 
                                                                type="number"
                                                                value={item.price}
                                                                onChange={(e) => updateVariantItem(idx, 'price', e.target.value)}
                                                                className="w-full pl-8 pr-2 py-1 bg-background border border-border/50 rounded text-[10px] font-bold outline-none focus:border-primary transition-all shadow-sm"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 border-y border-border/50">
                                                        <input 
                                                            type="number"
                                                            value={item.stock}
                                                            onChange={(e) => updateVariantItem(idx, 'stock', e.target.value)}
                                                            className="w-full px-2 py-1.5 bg-background border border-border/50 rounded-lg text-[10px] font-bold outline-none focus:border-primary transition-all shadow-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 rounded-r-md border-y border-r border-border/50">
                                                        <input 
                                                            type="text"
                                                            value={item.sku}
                                                            onChange={(e) => updateVariantItem(idx, 'sku', e.target.value)}
                                                            placeholder="SKU-XXX"
                                                            className="w-full px-2 py-1.5 bg-background border border-border/50 rounded-lg text-[10px] font-mono font-bold outline-none focus:border-primary transition-all shadow-sm"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </FormSection>
    );
}
