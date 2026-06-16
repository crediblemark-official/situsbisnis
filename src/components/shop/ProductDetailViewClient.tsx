"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";

import { ProductGallery } from "./product/ProductGallery";
import { ProductInfo } from "./product/ProductInfo";
import { ProductDescription } from "./product/ProductDescription";
import { ExpressCheckoutModal } from "./product/ExpressCheckoutModal";

export default function ProductDetailViewClient({ 
    product, 
    currency, 
    brandColor 
}: { 
    product: any; 
    currency: string; 
    brandColor: string 
}) {
    const router = useRouter();
    const { addToCart } = useCart();

    // Variant Selection State
    const [selectedOptions, setSelectedOptions] = React.useState<Record<string, string>>({});
    const [isExpressCheckoutOpen, setIsExpressCheckoutOpen] = React.useState(false);
    
    // Initialize default options
    React.useEffect(() => {
        if (product.variantOptions?.length > 0) {
            const defaults: Record<string, string> = {};
            product.variantOptions.forEach((opt: any) => {
                if (opt.values?.length > 0) {
                    defaults[opt.name] = opt.values[0];
                }
            });
            Promise.resolve().then(() => setSelectedOptions(defaults));
        }
    }, [product.variantOptions]);

    // Find current active variant based on selected options
    const currentVariant = React.useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;
        
        return product.variants.find((v: any) => {
            return Object.entries(selectedOptions).every(([key, value]) => {
                return v.attributes[key] === value;
            });
        });
    }, [selectedOptions, product.variants]);

    const activePrice = currentVariant?.price || product.price;
    const activeStock = currentVariant ? currentVariant.stock : product.stock;

    const isDigital = React.useMemo(() => {
        return product.metaData?.some((m: any) => m.key === "_isDigital" && m.value === "true") || false;
    }, [product.metaData]);

    const handleBuyNow = (qty: number) => {
        if (isDigital) {
            setIsExpressCheckoutOpen(true);
            return;
        }
        addToCart({
            productId: product.id,
            name: product.name,
            price: Number(activePrice),
            image: product.images?.[0],
            quantity: qty,
            variantName: currentVariant?.name,
            attributes: selectedOptions,
            stock: activeStock,
            isDigital: false
        }, false);
        router.push("/checkout");
    };

    const handleAddToCart = (qty: number) => {
        addToCart({
            productId: product.id,
            name: product.name,
            price: Number(activePrice),
            image: product.images?.[0],
            quantity: qty,
            variantName: currentVariant?.name,
            attributes: selectedOptions,
            stock: activeStock,
            isDigital
        }, true);
    };

    return (
        <div className="min-h-screen bg-white pb-28 lg:pb-16 font-sans selection:bg-slate-900 selection:text-white">
            {/* Header Spacer */}
            <div className="h-2 sm:h-10" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Mobile Navigation */}
                <nav className="mb-4 lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <ArrowLeft size={11} /> Kembali ke Toko
                    </Link>
                </nav>

                {/* Product Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
                    <ProductGallery 
                        product={product} 
                        brandColor={brandColor} 
                        isDigital={isDigital}
                        inStock={isDigital ? true : (activeStock || 0) > 0}
                        onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow}
                    />
                    
                    <div className="lg:col-span-7 w-full flex flex-col gap-5">
                        <ProductInfo 
                            product={product}
                            currency={currency}
                            brandColor={brandColor}
                            selectedOptions={selectedOptions}
                            setSelectedOptions={setSelectedOptions}
                            currentVariant={currentVariant}
                            activePrice={activePrice}
                            activeStock={activeStock}
                            onBuyNow={handleBuyNow}
                            onAddToCart={handleAddToCart}
                        />
                        
                        <ProductDescription 
                            product={product} 
                            brandColor={brandColor} 
                        />
                    </div>
                </div>
            </div>

            <ExpressCheckoutModal 
                isOpen={isExpressCheckoutOpen}
                onClose={() => setIsExpressCheckoutOpen(false)}
                product={product}
                activePrice={Number(activePrice)}
                currency={currency}
                brandColor={brandColor}
                selectedOptions={selectedOptions}
                variantName={currentVariant?.name}
            />
        </div>
    );
}
