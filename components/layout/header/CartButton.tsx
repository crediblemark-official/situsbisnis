"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";

interface CartButtonProps {
    textColor: string;
}

export function CartButton({ textColor }: CartButtonProps) {
    const { toggleCart, cartCount } = useCart();
    
    return (
        <button
            onClick={() => toggleCart()}
            className="relative rounded-full p-2 transition-colors hover:bg-foreground/5"
            style={{ color: textColor }}
            aria-label="Open Cart"
        >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {cartCount}
                </span>
            )}
        </button>
    );
}
