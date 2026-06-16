"use client";

import React from "react";
import { ShieldCheck, ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/billing/currency";
import { generateAutoExcerpt } from "@/lib/utils/string";


interface ProductInfoProps {
    product: any;
    currency: string;
    brandColor: string;
    selectedOptions: Record<string, string>;
    setSelectedOptions: (_opts: any) => void;
    currentVariant: any;
    activePrice: number;
    activeStock: number;
    onBuyNow: (_qty: number) => void;
    onAddToCart: (_qty: number) => void;
}

export function ProductInfo({ 
    product, 
    currency, 
    brandColor, 
    selectedOptions, 
    setSelectedOptions, 
    currentVariant: _currentVariant, 
    activePrice, 
    activeStock, 
    onBuyNow,
    onAddToCart
}: ProductInfoProps) {
    const isDigital = React.useMemo(() => {
        return product.metaData?.some((m: any) => m.key === "_isDigital" && m.value === "true") || false;
    }, [product.metaData]);

    const inStock = isDigital ? true : (activeStock || 0) > 0;
    const quantity = 1;

    const [isFooterVisible, setIsFooterVisible] = React.useState(false);

    React.useEffect(() => {
        const footer = document.querySelector("footer");
        if (!footer) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFooterVisible(entry.isIntersecting);
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0.05,
            }
        );

        observer.observe(footer);

        return () => {
            observer.disconnect();
        };
    }, []);

    const excerptText = React.useMemo(() => {
        if (product.seoMeta?.description) return product.seoMeta.description;
        const metaExcerpt = product.metaData?.find((m: any) => m.key === "excerpt")?.value;
        if (metaExcerpt) return metaExcerpt;
        if (product.description) {
            return generateAutoExcerpt(product.description);
        }
        return "";
    }, [product]);


    return (
        <div className="lg:col-span-7 w-full flex flex-col gap-5 font-sans">
            {/* Back Nav */}
            <Link 
                href="/" 
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors group mb-1"
            >
                <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
                Kembali ke Toko
            </Link>

            {/* Title / Name */}
            <div className="space-y-2">
                <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight leading-snug">
                    <span className="align-middle">{product.name}</span>
                </h1>
            </div>

            {/* Price Block - Light Gray with Pink/Orange Brand Accents */}
            <div className="bg-slate-50 p-4 rounded-xl flex items-center gap-4 flex-wrap border border-slate-100">
                {product.originalPrice && Number(product.originalPrice) > Number(activePrice) ? (
                    <>
                        <span className="text-slate-400 line-through text-xs sm:text-sm font-normal">
                            {formatPrice(Number(product.originalPrice), currency)}
                        </span>
                        
                        <span 
                            className="text-2xl sm:text-3xl font-bold tracking-tight" 
                            style={{ color: brandColor || '#ee4d2d' }}
                        >
                            {formatPrice(activePrice, currency)}
                        </span>
                        
                        <span 
                            className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white leading-none uppercase"
                            style={{ backgroundColor: brandColor || '#ee4d2d' }}
                        >
                            -{Math.round((1 - Number(activePrice) / Number(product.originalPrice)) * 100)}%
                        </span>
                    </>
                ) : (
                    <span 
                        className="text-2xl sm:text-3xl font-bold tracking-tight" 
                        style={{ color: brandColor || '#ee4d2d' }}
                    >
                        {formatPrice(activePrice, currency)}
                    </span>
                )}
            </div>

            {/* Grid-aligned Product Metadata Details */}
            <div className="space-y-4 pt-1.5">
                {/* 4. Variant Selectors */}
                {product.variantOptions && product.variantOptions.length > 0 && (
                    <div className="space-y-4.5">
                        {product.variantOptions.map((opt: any, idx: number) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <span className="text-slate-500 text-xs font-semibold capitalize sm:w-24 sm:flex-shrink-0">
                                    Pilih {opt.name}
                                </span>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {opt.values.map((val: string, vIdx: number) => {
                                        const isSelected = selectedOptions[opt.name] === val;
                                        return (
                                            <button
                                                key={vIdx}
                                                onClick={() => setSelectedOptions({ ...selectedOptions, [opt.name]: val })}
                                                className="px-3.5 py-1.5 rounded text-xs transition-all active:scale-[0.97] border font-medium shadow-sm"
                                                style={{ 
                                                    borderColor: isSelected ? (brandColor || '#ee4d2d') : '#e2e8f0',
                                                    color: isSelected ? (brandColor || '#ee4d2d') : '#475569',
                                                    backgroundColor: isSelected ? `${brandColor || '#ee4d2d'}06` : 'white',
                                                }}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 5. Stock Status */}
                {!isDigital && inStock && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
                        <span className="text-slate-500 text-xs font-semibold sm:w-24 sm:flex-shrink-0">Stok</span>
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                            Tersedia {activeStock} buah
                        </span>
                    </div>
                )}
            </div>

            {/* Excerpt / Short Description Block */}
            {excerptText && (
                <div className="text-[13px] text-slate-500 font-normal leading-relaxed pt-2.5 border-t border-slate-100/60 mt-1 select-text">
                    <span>{excerptText}</span>
                </div>
            )}

            {/* 6. Checkout Action Buttons - Sticky at the bottom on Mobile */}
            <div className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-slate-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-all duration-300 transform ${
                isFooterVisible ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
            }`}>
                <div className="flex flex-row items-center gap-2.5 sm:gap-3 w-full sm:max-w-lg mx-auto">
                    {/* Add to Cart */}
                    {!isDigital && (
                        <button
                            onClick={() => onAddToCart(quantity)}
                            disabled={!inStock}
                            className="flex-1 py-3 px-2 sm:px-4 border font-bold rounded flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-[10px] sm:text-xs uppercase tracking-wider"
                            style={{
                                borderColor: brandColor || '#ee4d2d',
                                color: brandColor || '#ee4d2d',
                                backgroundColor: `${brandColor || '#ee4d2d'}06`
                            }}
                        >
                            <ShoppingCart size={14} className="flex-shrink-0" />
                            <span className="truncate"><span className="hidden sm:inline">Masukkan </span>Keranjang</span>
                        </button>
                    )}

                    {/* Buy Now */}
                    <button
                        onClick={() => onBuyNow(quantity)}
                        disabled={!inStock}
                        className={`${isDigital ? 'w-full' : 'flex-1'} py-3 px-2 sm:px-4 text-[10px] sm:text-xs font-bold text-white rounded flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-sm`}
                        style={{
                            backgroundColor: inStock ? (brandColor || '#ee4d2d') : '#cbd5e1',
                            boxShadow: inStock ? `0 4px 14px -3px ${brandColor || '#ee4d2d'}40` : 'none'
                        }}
                    >
                        <ShieldCheck size={14} className="flex-shrink-0" />
                        <span className="truncate">Beli Sekarang</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

