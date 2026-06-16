"use client";

import React, { useState } from "react";
import {
    LayoutDashboard,
    Users,
    Globe,
    CreditCard,
    Settings,
    ShieldAlert,
    PanelLeftClose,
    PanelLeftOpen,
    FileText,
    Menu,
    X,
    Network,
    Banknote,
    Ticket,
    Database
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export default function AdminShell({
    children,
    session
}: {
    children: React.ReactNode;
    session: any;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Ikhtisar" },
        { href: "/admin/users", icon: <Users size={18} />, label: "Pengguna" },
        { href: "/admin/sites", icon: <Globe size={18} />, label: "Website" },
        { href: "/admin/subscriptions", icon: <CreditCard size={18} />, label: "Langganan" },
        { href: "/admin/transactions", icon: <FileText size={18} />, label: "Konfirmasi" },
        { href: "/admin/affiliates", icon: <Network size={18} />, label: "Afiliasi" },
        { href: "/admin/withdrawals", icon: <Banknote size={18} />, label: "Pencairan" },
        { href: "/admin/coupons", icon: <Ticket size={18} />, label: "Kupon" },
        { href: "/admin/backup", icon: <Database size={18} />, label: "Backup & Restore" },
        { href: "/admin/settings", icon: <Settings size={18} />, label: "Pengaturan" },
    ];

    const sidebarContent = (
        <div className={`flex flex-col h-full bg-card border-r border-border transition-all duration-300 overflow-x-hidden ${isCollapsed ? "md:w-12" : "md:w-64"} w-full`}>
            <div className={`h-11 border-b border-border flex items-center justify-between gap-3 transition-all duration-300 ${isCollapsed ? "px-2" : "px-4"}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-5 h-5 bg-primary rounded flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0">
                        <ShieldAlert size={12} />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden animate-in fade-in duration-500">
                            <h1 className="text-sm font-bold text-foreground whitespace-nowrap">Admin Utama</h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest whitespace-nowrap">Inti Platform</p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className={`flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ${isCollapsed ? "px-1" : "p-4"}`}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-md transition-all uppercase tracking-widest group relative ${isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                                } ${isCollapsed ? "md:justify-center px-0 py-3" : "px-3 py-2 text-[10px] font-black"}`}
                        >
                            <span className={`shrink-0 transition-colors ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`}>
                                {React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement<any>, { size: (isCollapsed && !isMobileMenuOpen) ? 18 : 14 }) : item.icon}
                            </span>
                            {(!isCollapsed || isMobileMenuOpen) && <span className="truncate">{item.label}</span>}

                            {isCollapsed && !isMobileMenuOpen && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-black uppercase tracking-widest rounded border border-border shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-2 border-t border-border hidden md:flex justify-center">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                    {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Desktop Sidebar */}
            <aside className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${isCollapsed ? "w-12" : "w-64"}`}>
                {sidebarContent}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="relative w-full max-w-[280px] h-full shadow-2xl animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-11 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-3 md:px-5 shrink-0 z-30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-all"
                            aria-label="Open Menu"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-[10px] md:text-xs font-bold text-foreground uppercase tracking-widest truncate max-w-[150px] md:max-w-none">
                            Panel Kendali Sistem
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <div className="h-4 w-[1px] bg-border mx-1"></div>
                        <div className="flex items-center gap-2 pl-1">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px] border border-primary/20 shrink-0">
                                    {session.user.name?.substring(0, 2).toUpperCase() || "AD"}
                                </div>
                                <div className="hidden sm:flex flex-col">
                                    <span className="text-[10px] font-black text-foreground leading-none">{session.user.name}</span>
                                    <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">Administrator</span>
                                </div>
                            </div>
                            <AdminLogoutButton />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar relative">
                    <div className="w-full px-3 md:px-5 py-0 md:py-4 relative">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
