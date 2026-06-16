"use client";

import React from "react";
import Image from "next/image";
import { ImageOff, ShoppingCart, ShieldCheck, Link2, Check } from "lucide-react";

interface ProductGalleryProps {
    product: any;
    brandColor: string;
    isDigital: boolean;
    inStock: boolean;
    onAddToCart: (_qty: number) => void;
    onBuyNow: (_qty: number) => void;
}

export function ProductGallery({ 
    product, 
    brandColor,
    isDigital,
    inStock,
    onAddToCart,
    onBuyNow
}: ProductGalleryProps) {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const images = React.useMemo(() => product.images || [], [product.images]);
    const [copiedLink, setCopiedLink] = React.useState(false);
    
    const handleCopyLink = () => {
        if (typeof window !== "undefined") {
            navigator.clipboard.writeText(window.location.href).then(() => {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
            }).catch(() => {});
        }
    };
    
    const [aspectRatio, setAspectRatio] = React.useState<"square" | "portrait" | "landscape">("square");
    const imageRef = React.useRef<HTMLImageElement | null>(null);

    const checkImageDimensions = React.useCallback((img: HTMLImageElement) => {
        if (img.naturalWidth && img.naturalHeight) {
            if (img.naturalHeight > img.naturalWidth * 1.15) {
                setAspectRatio("portrait");
            } else if (img.naturalWidth > img.naturalHeight * 1.15) {
                setAspectRatio("landscape");
            } else {
                setAspectRatio("square");
            }
        }
    }, []);

    // Set aspect ratio immediately if complete (cached / mounted)
    const handleImageRef = React.useCallback((node: HTMLImageElement | null) => {
        imageRef.current = node;
        if (node && node.complete) {
            checkImageDimensions(node);
        }
    }, [checkImageDimensions]);

    // Check dimensions on change or active index updates
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (imageRef.current) {
                if (imageRef.current.complete) {
                    checkImageDimensions(imageRef.current);
                }
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [activeIndex, images, checkImageDimensions]);

    return (
        <div className="lg:col-span-5 w-full">
            <div className="lg:sticky lg:top-24 space-y-4">
            {/* Main Product Image Container - Dynamic Aspect Ratio */}
            <div 
                className="relative w-full rounded-xl overflow-hidden bg-white flex items-center justify-center transition-all duration-500"
                style={{ 
                    aspectRatio: aspectRatio === "portrait" 
                        ? "3/4" 
                        : aspectRatio === "landscape" 
                        ? "4/3" 
                        : "1/1" 
                }}
            >
                {/* Blurry ambient background overlay to elegantly fill margins */}
                {images[activeIndex] && (images[activeIndex].startsWith('/') || images[activeIndex].startsWith('http')) && (
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-[0.08] scale-110 pointer-events-none select-none"
                        style={{ backgroundImage: `url(${images[activeIndex]})` }}
                    />
                )}

                {images[activeIndex] && (images[activeIndex].startsWith('/') || images[activeIndex].startsWith('http')) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={images[activeIndex]}
                        alt={product.name}
                        className="max-w-full max-h-full w-auto h-auto object-contain p-3.5 transition-all duration-300 relative z-10 animate-fade-in"
                        ref={handleImageRef}
                        onLoad={(e) => {
                            checkImageDimensions(e.currentTarget);
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-350 bg-slate-50 gap-2 relative z-10">
                        <ImageOff size={40} strokeWidth={1.5} />
                        <span className="text-[10px] font-semibold text-slate-400 tracking-wider">Tidak Ada Gambar</span>
                    </div>
                )}
            </div>

            {/* Horizontal Thumbnails Row - below main image */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
                    {images.map((img: string, idx: number) => (
                        <button
                            key={`thumb-${idx}`}
                            onClick={() => setActiveIndex(idx)}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-white shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                            style={{ 
                                borderColor: idx === activeIndex ? brandColor : '#f1f5f9',
                                opacity: idx === activeIndex ? 1 : 0.7,
                            }}
                        >
                            {img && (img.startsWith('/') || img.startsWith('http')) ? (
                                <Image src={img} alt={`${product.name} thumbnail ${idx}`} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover p-0.5" unoptimized />
                            ) : (
                                <div className="w-full h-full bg-slate-50" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Centered Share Row - Premium Icons Variety */}
            <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-slate-100/80 text-[11px] w-full">
                <div className="flex items-center gap-3 text-slate-500 font-semibold select-none">
                    <span>Bagikan Produk Ini</span>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                    {/* WhatsApp */}
                    <a 
                        href={`https://api.whatsapp.com/send?text=Lihat%20buku%20keren%20ini%3A%20${encodeURIComponent(product.name)}%20di%20${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7.5 h-7.5 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 active:scale-95 transition-all shadow-sm border border-emerald-100/50 cursor-pointer"
                        title="Bagikan ke WhatsApp"
                    >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.402.002 9.761-4.394 9.764-9.778.002-2.607-1.01-5.059-2.85-6.902C16.344 2.083 13.91 1.07 11.997 1.07c-5.404 0-9.766 4.395-9.77 9.779-.002 1.83.49 3.62 1.425 5.191l-.999 3.646 3.794-.992zm11.066-5.836c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                        </svg>
                    </a>
                    {/* Facebook */}
                    <a 
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7.5 h-7.5 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 active:scale-95 transition-all shadow-sm border border-blue-100/50 cursor-pointer"
                        title="Bagikan ke Facebook"
                    >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                    </a>
                    {/* Telegram */}
                    <a 
                        href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=Lihat%20buku%20keren%20ini%3A%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7.5 h-7.5 rounded-full bg-sky-50 hover:bg-sky-100 flex items-center justify-center text-sky-500 active:scale-95 transition-all shadow-sm border border-sky-100/50 cursor-pointer"
                        title="Bagikan ke Telegram"
                    >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.46c.538-.196 1.006.128.832.941z"/>
                        </svg>
                    </a>
                    {/* X (Twitter) */}
                    <a 
                        href={`https://x.com/intent/tweet?text=Lihat%20buku%20keren%20ini%3A%20${encodeURIComponent(product.name)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7.5 h-7.5 rounded-full bg-slate-50 hover:bg-slate-150 flex items-center justify-center text-slate-800 active:scale-95 transition-all shadow-sm border border-slate-200/50 cursor-pointer"
                        title="Bagikan ke X"
                    >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>
                    {/* Copy Link */}
                    <button 
                        onClick={handleCopyLink}
                        className={`w-7.5 h-7.5 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-sm border cursor-pointer ${
                            copiedLink 
                                ? "bg-emerald-500 text-white border-emerald-500" 
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/50"
                        }`}
                        title="Salin Tautan Produk"
                    >
                        {copiedLink ? <Check size={12} /> : <Link2 size={12} />}
                    </button>
                </div>
            </div>

            {/* Desktop Checkout Action Buttons - Sticky under Image */}
            <div className="hidden lg:flex items-center gap-3 pt-1">
                <div className="flex flex-row items-center gap-3 w-full">
                    {/* Add to Cart */}
                    {!isDigital && (
                        <button
                            onClick={() => onAddToCart(1)}
                            disabled={!inStock}
                            className="flex-1 py-3 px-4 border font-bold rounded flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-xs uppercase tracking-wider bg-white cursor-pointer"
                            style={{
                                borderColor: brandColor || '#ee4d2d',
                                color: brandColor || '#ee4d2d',
                                backgroundColor: `${brandColor || '#ee4d2d'}06`
                            }}
                        >
                            <ShoppingCart size={14} className="flex-shrink-0" />
                            <span className="truncate">Masukkan Keranjang</span>
                        </button>
                    )}

                    {/* Buy Now */}
                    <button
                        onClick={() => onBuyNow(1)}
                        disabled={!inStock}
                        className={`${isDigital ? 'w-full' : 'flex-1'} py-3 px-4 text-xs font-bold text-white rounded flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-sm cursor-pointer`}
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
    </div>
);
}
