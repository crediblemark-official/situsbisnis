"use client";

import React from "react";
import Image from "next/image";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { useCurrency } from "@/hooks/use-currency";
import { useRouter } from "next/navigation";

export default function CartDrawer({ brandColor }: { brandColor?: string }) {
    const { items, removeFromCart, updateQuantity, cartTotal, isCartOpen, toggleCart } = useCart();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const activeColor = brandColor || "#0ea5e9";

    if (!isCartOpen) return null;

    const handleCheckout = () => {
        toggleCart();
        router.push("/checkout");
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={() => toggleCart()}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300 border-l border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground flex items-center tracking-tight">
                        <ShoppingBag className="mr-3" style={{ color: activeColor }} />
                        Your Cart ({items.length})
                    </h2>
                    <button
                        onClick={() => toggleCart()}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
                        aria-label="Close cart"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center text-muted-foreground">
                                <ShoppingBag size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-foreground">Your cart is empty</h3>
                            <p className="text-muted-foreground max-w-xs">Looks like you haven&apos;t added anything to your cart yet.</p>
                            <button
                                onClick={() => toggleCart()}
                                className="px-6 py-2 text-white rounded-lg font-medium transition-all hover:brightness-110 active:scale-[0.98]"
                                style={{ backgroundColor: activeColor }}
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item, _idx) => (
                            <div key={`${item.productId}-${item.variantName || 'base'}`} className="flex gap-4">
                                <div className="w-20 h-20 bg-muted/10 rounded-lg overflow-hidden border border-border flex-shrink-0 relative">
                                    {item.image ? (
                                        <Image src={item.image} alt={item.name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                                            <ShoppingBag size={20} className="text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-medium text-foreground line-clamp-1">{item.name}</h4>
                                        {item.variantName && (
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">{item.variantName}</p>
                                        )}
                                        <div className="font-bold mt-1" style={{ color: activeColor }}>{formatPrice(item.price)}</div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center border border-border rounded-lg bg-muted/10">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantName)}
                                                className="p-1 hover:bg-muted/20 rounded-l-lg transition-colors text-muted-foreground"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={14} aria-hidden="true" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantName)}
                                                disabled={item.stock !== undefined && item.quantity >= Number(item.stock)}
                                                className="p-1 hover:bg-muted/20 rounded-r-lg transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={14} aria-hidden="true" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.productId, item.variantName)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 size={16} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-border bg-muted/5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-xl font-bold text-foreground tracking-tight">{formatPrice(cartTotal)}</span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full py-3 text-white rounded-xl font-bold transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                            style={{ 
                                backgroundColor: activeColor, 
                                boxShadow: `0 8px 16px -4px ${activeColor}30` 
                            }}
                        >
                            Checkout Now
                        </button>
                        <div className="text-center mt-3">
                            <button onClick={() => toggleCart()} className="text-sm text-muted-foreground hover:text-foreground">
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
