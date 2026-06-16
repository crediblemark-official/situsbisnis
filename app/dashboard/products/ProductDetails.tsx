
"use client";

import { useCart } from "@/components/providers/cart-provider";
import { useCurrency } from "@/hooks/use-currency";
import { ShoppingCart, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import TiptapRenderer from "@/components/editor/TiptapRenderer";


export default function ProductDetails({ product, backUrl = "/dashboard/products" }: { product: any, backUrl?: string }) {
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const [selectedImage, setSelectedImage] = useState(product.images?.[0] || "");
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = () => {
        addToCart({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0],
            quantity: 1,
        });
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="w-full pb-10">
            <div className="mb-6">
                <Link href={backUrl} className="text-white hover:text-gray-900 inline-flex items-center">
                    <ArrowLeft size={20} className="mr-2" /> Kembali
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                    {/* Image Gallery */}
                    <div className="bg-gray-50 p-6 md:p-10 flex flex-col items-center">
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 mb-4 relative">
                            {selectedImage ? (
                                <Image 
                                    src={selectedImage} 
                                    alt={product.name} 
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill 
                                    className="object-contain" 
                                    unoptimized 
                                    priority
                                    loading="eager"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white">Tanpa Gambar</div>
                            )}
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto w-full p-1">
                                {product.images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 relative ${selectedImage === img ? 'border-indigo-600' : 'border-transparent'}`}
                                    >
                                        <Image src={img} alt={`${product.name} thumbnail ${i}`} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover" unoptimized />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="p-8 md:p-12 flex flex-col h-full">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <div className="text-2xl font-bold text-emerald-600 mb-6">{formatPrice(product.price)}</div>

                        <div className="prose prose-sm text-white mb-8 flex-1">
                            <TiptapRenderer content={product.description || ""} />
                        </div>

                        <div className="mt-auto border-t border-gray-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-white">
                                    Ketersediaan:
                                    <span className={(product.stock || 0) > 0 ? "text-emerald-600 ml-1" : "text-red-500 ml-1"}>
                                        {(product.stock || 0) > 0 ? "Stok Tersedia" : "Stok Habis"}
                                    </span>
                                </span>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={isAdded}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center shadow-lg transform active:scale-[0.99] cursor-pointer ${isAdded
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl"
                                    }`}
                            >
                                {isAdded ? (
                                    <>
                                        <CheckCircle size={24} className="mr-3" />
                                        Berhasil Ditambah!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart size={24} className="mr-3" />
                                        Tambah ke Keranjang
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
