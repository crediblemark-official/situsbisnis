"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/providers/cart-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <SessionProvider>
                <CartProvider>
                    {children}
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            duration: 3000,
                            style: {
                                background: 'var(--card)',
                                color: 'var(--foreground)',
                                border: '1px solid var(--border)',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                borderRadius: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            },
                        }}
                    />
                </CartProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}
