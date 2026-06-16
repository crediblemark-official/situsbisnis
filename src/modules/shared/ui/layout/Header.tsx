"use client";
// Force HMR invalidation

import React, { useEffect, useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { SiteSettings } from "@/modules/tenant/services/site-settings.service";

interface HeaderProps {
    initialSettings?: SiteSettings | null;
    initialMenuItems?: any[];
    isTenant?: boolean;
}

import { Logo } from "./header/Logo";
import { NavLinks } from "./header/NavLinks";
import { CartButton } from "./header/CartButton";
import { MobileMenu } from "./header/MobileMenu";

export default function Header({ initialSettings, initialMenuItems = [], isTenant = true }: HeaderProps) {
    const [settings, setSettings] = useState<SiteSettings | null>(initialSettings || null);
    const [menuItems, setMenuItems] = useState<any[]>(initialMenuItems);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [scrollDirection, setScrollDirection] = useState("up");
    const lastScrollYRef = useRef(0);

    useEffect(() => {
        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollYRef.current ? "down" : "up";
            if (direction !== scrollDirection && Math.abs(scrollY - lastScrollYRef.current) > 10) {
                setScrollDirection(direction);
            }
            lastScrollYRef.current = scrollY > 0 ? scrollY : 0;
        };
        window.addEventListener("scroll", updateScrollDirection, { passive: true });
        return () => window.removeEventListener("scroll", updateScrollDirection);
    }, [scrollDirection]);

    useEffect(() => {
        if (!initialSettings) {
            fetch("/api/settings").then(res => res.json()).then(setSettings).catch(console.error);
        }
        if (initialMenuItems.length === 0) {
            fetch("/api/menus?slug=main").then(res => res.json()).then(data => {
                if (data?.items) setMenuItems(data.items.sort((a: any, b: any) => a.order - b.order));
            }).catch(console.error);
        }
    }, [initialSettings, initialMenuItems]);

    const headerStyle = settings?.headerStyle || "simple";
    const backgroundColor = settings?.headerBackgroundColor || "#0369a1";
    const textColor = settings?.headerTextColor || "#ffffff";

    const commonHeaderProps = {
        className: `sticky top-0 z-50 w-full border-b border-white shadow-md transition-transform duration-300 ease-in-out ${scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"}`,
        style: { backgroundColor }
    };

    if (headerStyle === "centered") {
        return (
            <header {...commonHeaderProps}>
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex-1" />
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                        <Logo settings={settings} textColor={textColor} />
                    </div>
                    <div className="flex-1 flex justify-end items-center gap-4">
                        {(isTenant && settings?.showCart !== false) && <CartButton textColor={textColor} />}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 -mr-2 rounded-md transition-colors hover:bg-foreground/5 relative z-20"
                            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
                            style={{ color: textColor }}
                        >
                            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
                <div className="hidden md:flex justify-center border-t border-border/10 py-3 relative">
                    <nav className="flex gap-8 items-center">
                        <NavLinks menuItems={menuItems} textColor={textColor} isTenant={isTenant} />
                    </nav>
                </div>
                <MobileMenu 
                    show={showMobileMenu} 
                    menuItems={menuItems} 
                    backgroundColor={settings?.headerMobileBackgroundColor} 
                    isTenant={isTenant}
                />
            </header>
        );
    }

    return (
        <header {...commonHeaderProps}>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Logo settings={settings} textColor={textColor} />
                <div className="flex items-center gap-8">
                    {headerStyle !== "minimal" && (
                        <nav className="hidden md:flex md:gap-8 items-center">
                            <NavLinks menuItems={menuItems} textColor={textColor} isTenant={isTenant} />
                        </nav>
                    )}
                    <div className="flex items-center gap-4">
                        {(isTenant && settings?.showCart !== false) && <CartButton textColor={textColor} />}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className={`${headerStyle === "minimal" ? "block" : "md:hidden"} hover:opacity-75 relative z-20 -mr-2 p-2`}
                            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
                            style={{ color: textColor }}
                        >
                            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>
            <MobileMenu 
                show={showMobileMenu} 
                menuItems={menuItems} 
                backgroundColor={settings?.headerMobileBackgroundColor} 
                headerStyle={headerStyle}
                isTenant={isTenant}
            />
        </header>
    );
}
