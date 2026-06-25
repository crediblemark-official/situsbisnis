"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Bell,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import StoreSwitcher from "./StoreSwitcher";
import { SiteSettings } from "@/types/site-settings";
import ThemeToggle from "./ThemeToggle";
import { getNavConfig } from "./nav-config";
import { ProfileDropdown } from "./ProfileDropdown";
import { GlobalSearch } from "./GlobalSearch";

interface DashboardShellProps {
    children: React.ReactNode;
    initialSettings?: SiteSettings | null;
    siteId?: string | null;
    userRole?: string;
}

export default function DashboardShell({
    children,
    initialSettings,
    siteId,
    userRole = "user"
}: DashboardShellProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [settings, setSettings] = useState<SiteSettings | null>(initialSettings || null);
    const [siteName, setSiteName] = useState(initialSettings?.siteName || "Builder CMS");

    useEffect(() => {
        fetch("/api/settings", {
            headers: siteId ? { "x-site-id": siteId } : {}
        })
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                if (data?.siteName) {
                    setSiteName(data.siteName);
                }
            })
            .catch(err => console.error(err));
    }, [initialSettings, siteId]);

    const navSections = getNavConfig(siteId || null, settings);

    const sidebarContent = (
        <div className={`flex flex-col h-full bg-card border-r border-border transition-all duration-300 overflow-x-hidden ${isCollapsed ? "w-12" : "w-64"}`}>
            <div className={`h-11 flex items-center border-b border-border justify-between transition-all duration-300 overflow-x-hidden ${isCollapsed ? "px-0" : "px-4"}`}>
                <Link href="/" target="_blank" className={`flex items-center gap-2 group overflow-hidden transition-all duration-300 ${isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"}`}>
                    <div className="w-5 h-5 rounded bg-secondary flex items-center justify-center text-foreground font-bold text-[10px] transition-colors group-hover:bg-accent shrink-0">
                        {siteName[0]}
                    </div>
                    <span className="text-xs font-semibold text-foreground tracking-tight truncate whitespace-nowrap">
                        {siteName}
                    </span>
                </Link>
                
                <button
                    onClick={() => {
                        if (window.innerWidth < 768) {
                            setIsMobileMenuOpen(false);
                        } else {
                            setIsCollapsed(!isCollapsed);
                        }
                    }}
                    className={`text-muted-foreground hover:text-primary transition-all p-1 rounded hover:bg-primary/5 ${isCollapsed ? "mx-auto" : ""}`}
                >
                    {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
            </div>

            <nav className={`flex-1 p-1 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all duration-300 ${isCollapsed ? "px-1.5 space-y-1" : "px-1 space-y-2"}`}>
                {navSections.map((section, i) => {
                    const visibleItems = section.items.filter(item =>
                        !item.roles || item.roles.includes(userRole)
                    );

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={i} className="space-y-0.5">
                            {section.title && !isCollapsed && (
                                <p className="px-4 text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-wider mb-1 mt-4 first:mt-2 transition-all">
                                    {section.title}
                                </p>
                            )}
                            {visibleItems.map((item) => (
                                <div key={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                                    <NavItem {...item} isActive={pathname === item.href} isCollapsed={isCollapsed} badge={(item as any).badge} />
                                </div>
                            ))}
                        </div>
                    );
                })}
            </nav>

        </div>
    );

    return (
        <div className="flex h-screen bg-background text-foreground font-sans selection:bg-accent/30">
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col z-20 transition-all duration-300 ${isCollapsed ? "w-12" : "w-64"}`}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full h-full shadow-2xl animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
                <header className="sticky top-0 h-11 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-0 z-30 shrink-0">
                    <div className="flex items-center gap-1 flex-1 px-3 md:px-5">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-1 text-foreground hover:bg-muted/50 rounded transition-all"
                            aria-label="Open Menu"
                        >
                            <Menu size={18} />
                        </button>
                        <StoreSwitcher currentSiteId={siteId || null} currentSiteName={siteName} />
                        {siteId && (
                            <span className={`ml-2 shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                userRole === "owner" 
                                    ? "bg-primary/10 text-primary border-primary/20" 
                                    : userRole === "editor"
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            }`}>
                                {userRole === "owner" ? "Pemilik" : userRole === "editor" ? "Editor" : "Staf"}
                            </span>
                        )}
                        <div className="hidden sm:block flex-1 max-w-[300px] ml-2">
                            <GlobalSearch navSections={navSections} />
                        </div>
                    </div>

                    <div className="flex items-center space-x-0.5 md:space-x-2 px-3 md:px-5">
                        <ThemeToggle />
                        <button className="p-1 text-foreground hover:bg-muted/50 rounded transition-all">
                            <Bell size={16} />
                        </button>
                        <div className="h-4 w-[1px] bg-border mx-0.5 opacity-50"></div>
                        <ProfileDropdown session={session} />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
                    {pathname.startsWith("/dashboard/checkout") ? (
                        // Checkout gets full viewport, no shell padding
                        <>{children}</>
                    ) : (
                        <div className="w-full px-3 md:px-5 py-0 md:py-4">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function NavItem({ href, icon, label, isActive, isCollapsed, badge }: { href: string; icon: React.ReactNode; label: string; isActive: boolean; isCollapsed?: boolean; badge?: string }) {
    return (
        <a
            href={href}
            className={`flex items-center px-3.5 py-1.5 text-[11px] font-semibold rounded-md transition-all group relative ${
                isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
        >
            <span className={`transition-all duration-300 ${isCollapsed ? "mr-0" : "mr-3"} ${isActive ? "text-primary scale-110" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"}`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
                    size: 16,
                    strokeWidth: isActive ? 2.5 : 2
                }) : icon}
            </span>
            {!isCollapsed && (
                <span className="truncate tracking-tight flex-1">{label}</span>
            )}
            {!isCollapsed && badge && (
                <span className="ml-1.5 shrink-0 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[8px] font-black uppercase tracking-widest">
                    {badge}
                </span>
            )}
            
            {isActive && !isCollapsed && (
                <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-full" />
            )}
            
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover text-popover-foreground text-[10px] font-semibold rounded-md border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap">
                    {label}{badge ? ` (${badge})` : ""}
                </div>
            )}
        </a>
    );
}
