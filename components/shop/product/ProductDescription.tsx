"use client";

import React from "react";
import TiptapRenderer from "@/components/editor/TiptapRenderer";
import { Truck, ShieldCheck, Star, BookOpen } from "lucide-react";

interface ProductDescriptionProps {
    product: any;
    brandColor: string;
}

export function ProductDescription({ product, brandColor }: ProductDescriptionProps) {
    const displaySpecs = React.useMemo(() => {
        if (product.metaData && product.metaData.length > 0) {
            return product.metaData.filter(
                (meta: any) => meta.key !== "excerpt" && !meta.key.startsWith("_")
            );
        }
        
        const isAcademic = product.name?.toLowerCase().includes("education") || product.name?.toLowerCase().includes("pembelajaran");
        if (isAcademic) {
            return [
                { key: "Format", value: "Buku Cetak / Softcover" },
                { key: "Penerbit", value: "Unived Press" },
                { key: "Bahasa", value: "Indonesia & Inggris" },
                { key: "Dimensi", value: "15.5 x 23 cm" },
                { key: "Edisi", value: "Edisi Pertama (2026)" },
                { key: "Kategori", value: "Pendidikan Jasmani" }
            ];
        }
        return [];
    }, [product.metaData, product.name]);

    return (
        <div id="deskripsi" className="pt-2 border-t border-slate-100/60 w-full">
            <div className="space-y-6">
                {/* Detail Produk - Specs */}
                {displaySpecs.length > 0 && (
                    <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/85 shadow-sm mb-5 w-full">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <BookOpen size={15} style={{ color: brandColor }} />
                            <h3 className="text-xs font-semibold text-slate-700">Detail Produk</h3>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                            {displaySpecs.map((meta: any, idx: number) => (
                                <li key={meta.id || idx} className="text-xs flex justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                                    <span className="font-medium text-slate-500">{meta.key}</span>
                                    <span className="font-semibold text-slate-800 text-right">{meta.value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: brandColor }} />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Deskripsi Lengkap</h2>
                </div>
                <div className="max-w-none text-slate-650 font-sans leading-relaxed text-sm sm:text-base">
                    <TiptapRenderer content={product.description || ""} />
                </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mt-8 pt-8 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2 sm:p-3.5 rounded-xl bg-slate-50/60 border border-slate-100/80 transition-all hover:bg-slate-50">
                    <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${brandColor}12`, color: brandColor }}
                    >
                        <Truck size={15} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">Pengiriman</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-normal mt-0.5 sm:mt-1 truncate">Cepat &amp; aman</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2 sm:p-3.5 rounded-xl bg-slate-50/60 border border-slate-100/80 transition-all hover:bg-slate-50">
                    <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${brandColor}12`, color: brandColor }}
                    >
                        <ShieldCheck size={15} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">100% Aman</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-normal mt-0.5 sm:mt-1 truncate">Enkripsi penuh</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-1.5 sm:gap-3 p-2 sm:p-3.5 rounded-xl bg-slate-50/60 border border-slate-100/80 transition-all hover:bg-slate-50">
                    <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${brandColor}12`, color: brandColor }}
                    >
                        <Star size={15} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">Terjamin</p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-normal leading-normal mt-0.5 sm:mt-1 truncate">Kualitas asli</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
