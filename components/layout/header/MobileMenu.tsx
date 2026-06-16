"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface MobileMenuProps {
    show: boolean;
    menuItems: any[];
    backgroundColor?: string;
    headerStyle?: string;
    isTenant?: boolean;
}

export function MobileMenu({ show, menuItems, backgroundColor, headerStyle, isTenant = true }: MobileMenuProps) {
    const isMinimal = headerStyle === "minimal";
    const { status } = useSession();
    const isLoggedIn = status === "authenticated";
    
    return (
        <div
            className={`
                ${isMinimal ? "block" : "md:hidden"} 
                border-t border-border/10 overflow-hidden transition-all duration-300 ease-in-out 
                ${show ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}
            `}
            style={{ backgroundColor: backgroundColor || "var(--card)" }}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex whitespace-nowrap py-3 gap-6 items-center" style={{ paddingLeft: isMinimal ? '40px' : '0' }}>
                        {menuItems.length > 0 ? (
                            <>
                                {menuItems.map((link) => (
                                    <Link
                                        key={link.id}
                                        href={link.url}
                                        target={link.target || "_self"}
                                        className="text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                {!isTenant && (
                                    isLoggedIn ? (
                                        <Link href="/dashboard" className="text-sm font-bold text-white px-4 py-1.5 bg-sky-500 rounded-full hover:shadow-md transition-shadow">Dashboard</Link>
                                    ) : (
                                        <Link href="/register" className="text-sm font-bold text-white px-4 py-1.5 bg-sky-500 rounded-full hover:shadow-md transition-shadow">Mulai Gratis</Link>
                                    )
                                )}
                            </>
                        ) : (
                            <>
                                <Link href="/solusi" className="text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors">Solusi</Link>
                                <Link href="/pricing" className="text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors">Harga</Link>
                                {!isTenant && isLoggedIn ? (
                                    <Link href="/dashboard" className="text-sm font-bold text-white px-4 py-1.5 bg-sky-500 rounded-full hover:shadow-md transition-shadow">Dashboard</Link>
                                ) : (
                                    <Link href="/register" className="text-sm font-bold text-white px-4 py-1.5 bg-sky-500 rounded-full hover:shadow-md transition-shadow">Mulai Gratis</Link>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
