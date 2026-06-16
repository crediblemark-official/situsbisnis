"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";
import { useCart, CartItem } from "@/components/providers/cart-provider";

export default function AddToCartButton({ 
    product, 
    brandColor,
    variant = "primary"
}: { 
    product: any;
    brandColor?: string;
    variant?: "primary" | "secondary";
}) {
    const { addToCart } = useCart();
    const activeColor = brandColor || "#059669"; // fallback to emerald-600

    const handleAddToCart = () => {
        const item: CartItem = {
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0],
            quantity: 1,
            variantName: product.variantName,
            attributes: product.attributes,
            stock: product.stock
        };
        addToCart(item);
    };

    const isOutOfStock = (product.stock || 0) <= 0;

    if (variant === "secondary") {
        return (
            <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 border-2 whitespace-nowrap ${isOutOfStock
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-transparent hover:bg-slate-50 active:bg-slate-100"
                    }`}
                style={{ 
                    borderColor: isOutOfStock ? undefined : activeColor,
                    color: isOutOfStock ? undefined : activeColor
                }}
            >
                <ShoppingCart size={14} />
                {isOutOfStock ? "Stok Habis" : "Add to Cart"}
            </button>
        );
    }

    return (
        <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-3.5 text-white rounded-xl font-bold text-sm transition-all active:scale-[0.98] shadow-md flex items-center justify-center ${isOutOfStock
                ? "bg-gray-400 cursor-not-allowed shadow-none"
                : "hover:brightness-110"
                }`}
            style={{ 
                backgroundColor: isOutOfStock ? undefined : activeColor,
                boxShadow: isOutOfStock ? undefined : `0 8px 16px -4px ${activeColor}30`
            }}
        >
            <ShoppingCart className="mr-2" size={16} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
    );
}
