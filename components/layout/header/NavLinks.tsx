"use client";

import React from "react";
import { LazyLink as Link } from "@/components/ui/LazyLink";
import { ChevronDown } from "lucide-react";
import { MegaMenuContent } from "./MegaMenuContent";
import { useSession } from "next-auth/react";

interface NavLinksProps {
    menuItems: any[];
    textColor: string;
    isTenant?: boolean;
}

export function NavLinks({ menuItems, textColor, isTenant = true }: NavLinksProps) {
    const { status } = useSession();
    const isLoggedIn = status === "authenticated";

    if (menuItems.length > 0) {
        return (
            <>
                {menuItems.map((link) => (
                    <Link
                        key={link.id}
                        href={link.url}
                        target={link.target || "_self"}
                        className="text-sm font-medium transition-colors hover:opacity-75"
                        style={{ color: textColor }}
                    >
                        {link.label}
                    </Link>
                ))}
                {!isTenant && (
                    isLoggedIn ? (
                        <Link href="/dashboard" className="text-sm font-bold text-primary px-4 py-2 bg-white rounded-full shadow-lg shadow-black/5 hover:scale-105 transition-transform">Dashboard</Link>
                    ) : (
                        <Link href="/register" className="text-sm font-bold text-primary px-4 py-2 bg-white rounded-full shadow-lg shadow-black/5 hover:scale-105 transition-transform">Mulai Gratis</Link>
                    )
                )}
            </>
        );
    }

    return (
        <>
            <div className="group/mega">
                <button
                    className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-75 py-2"
                    style={{ color: textColor }}
                >
                    Solusi <ChevronDown size={14} className="group-hover/mega:rotate-180 transition-transform" />
                </button>
                <MegaMenuContent />
            </div>
            <Link href="/pricing" className="text-sm font-medium hover:opacity-75" style={{ color: textColor }}>Harga</Link>
            {!isTenant && isLoggedIn ? (
                <Link href="/dashboard" className="text-sm font-bold text-primary px-4 py-2 bg-white rounded-full shadow-lg shadow-black/5 hover:scale-105 transition-transform">Dashboard</Link>
            ) : (
                <Link href="/register" className="text-sm font-bold text-primary px-4 py-2 bg-white rounded-full shadow-lg shadow-black/5 hover:scale-105 transition-transform">Mulai Gratis</Link>
            )}
        </>
    );
}
