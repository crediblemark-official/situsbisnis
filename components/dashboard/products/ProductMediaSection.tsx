"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { FormSection } from "@/components/ui/Form";
import { MediaPickerField } from "@/components/credbuild/MediaPickerField";

interface ProductMediaSectionProps {
    images: string[];
    onAddImage: (_url: string) => void;
    onRemoveImage: (_index: number) => void;
}

export function ProductMediaSection({
    images,
    onAddImage,
    onRemoveImage
}: ProductMediaSectionProps) {
    return (
        <FormSection 
            title="Media Produk" 
            description="Kelola galeri visual produk Anda."
        >
            <div className="space-y-4">
                {images.length > 0 ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        {/* Compact sub-header when there are images */}
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Galeri Gambar ({images.length})</span>
                        </div>

                        {/* Images Grid including the addition tile */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group rounded-xl overflow-hidden border border-border aspect-square bg-muted/5 shadow-md hover:shadow-xl transition-all duration-300">
                                    {img && (img.startsWith('/') || img.startsWith('http')) ? (
                                        <Image src={img} alt={`Produk ${idx}`} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] font-bold">
                                            Invalid URL
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px] duration-300">
                                        <button
                                            type="button"
                                            onClick={() => onRemoveImage(idx)}
                                            className="w-10 h-10 flex items-center justify-center bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/40 active:scale-95 transition-all border border-red-500/20 shadow-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Dotted upload trigger inside the grid */}
                            <div className="aspect-square w-full">
                                <MediaPickerField 
                                    id="product-image-add"
                                    value="" 
                                    variant="square"
                                    onChange={(val) => {
                                        if (val && !images.includes(val)) {
                                            onAddImage(val);
                                        }
                                    }} 
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Combined Empty State and Main Trigger */
                    <div className="flex flex-col gap-2 animate-in fade-in duration-500">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Galeri Gambar</span>
                        <div className="relative group/empty cursor-pointer">
                            <MediaPickerField 
                                id="product-image-empty"
                                value="" 
                                onChange={(val) => {
                                    if (val && !images.includes(val)) {
                                        onAddImage(val);
                                    }
                                }} 
                            />
                            {/* Overlay helper inside the aspect-video to explain they can click it */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center w-full max-w-[85%]">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-50 group-hover/empty:opacity-100 transition-opacity">Belum ada gambar ditambahkan. Ketuk di sini untuk memilih gambar.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </FormSection>
    );
}
