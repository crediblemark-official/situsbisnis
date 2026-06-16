
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
    productId: string;
    name: string;
    price: number;
    image?: string;
    quantity: number;
    variantName?: string;
    attributes?: Record<string, string>;
    stock?: number;
    isDigital?: boolean;
};

type CartContextType = {
    items: CartItem[];
    addToCart: (_item: CartItem, _openCart?: boolean) => void;
    removeFromCart: (_productId: string, _variantName?: string) => void;
    updateQuantity: (_productId: string, _quantity: number, _variantName?: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    isCartOpen: boolean;
    toggleCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage and sync across tabs
    useEffect(() => {
        const loadCart = () => {
            const saved = localStorage.getItem("cart");
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse cart", e);
                }
            }
        };

        loadCart();
        Promise.resolve().then(() => setIsLoaded(true));

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "cart") {
                loadCart();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addToCart = (newItem: CartItem, openCart: boolean = true) => {
        setItems((prev) => {
            const existing = prev.find((i) => 
                i.productId === newItem.productId && 
                i.variantName === newItem.variantName
            );
            if (existing) {
                return prev.map((i) => {
                    if (i.productId === newItem.productId && i.variantName === newItem.variantName) {
                        const newQty = i.quantity + newItem.quantity;
                        const stockLimit = newItem.stock !== undefined ? Number(newItem.stock) : undefined;
                        const finalQty = stockLimit !== undefined ? Math.min(newQty, stockLimit) : newQty;
                        return { ...i, stock: stockLimit, quantity: finalQty };
                    }
                    return i;
                });
            }
            const cleanNewItem = {
                ...newItem,
                stock: newItem.stock !== undefined ? Number(newItem.stock) : undefined
            };
            return [...prev, cleanNewItem];
        });
        if (openCart) {
            setIsCartOpen(true); // Open cart only if requested
        }
    };

    const removeFromCart = (productId: string, variantName?: string) => {
        setItems((prev) => prev.filter((i) => 
            !(i.productId === productId && i.variantName === variantName)
        ));
    };

    const updateQuantity = (productId: string, quantity: number, variantName?: string) => {
        if (quantity < 1) {
            removeFromCart(productId, variantName);
            return;
        }
        setItems((prev) =>
            prev.map((i) => {
                if (i.productId === productId && i.variantName === variantName) {
                    const stockLimit = i.stock !== undefined ? Number(i.stock) : undefined;
                    const finalQty = stockLimit !== undefined ? Math.min(quantity, stockLimit) : quantity;
                    return { ...i, quantity: finalQty };
                }
                return i;
            })
        );
    };

    const clearCart = () => setItems([]);
    const toggleCart = () => setIsCartOpen((prev) => !prev);

    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            isCartOpen,
            toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
