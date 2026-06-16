"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, ShieldCheck, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface ProfileDropdownProps {
    session: any;
}

export function ProfileDropdown({ session }: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleFocusOut = (e: React.FocusEvent) => {
        // Close if focus moves to an element outside the dropdown
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef} onBlur={handleFocusOut}>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 hover:bg-muted/50 px-2 py-1 rounded transition-all focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none"
            >
                <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-foreground text-[10px] font-bold">
                    {(session?.user?.name?.[0] || "A").toUpperCase()}
                </div>
                <div className="hidden md:block text-xs text-left">
                    <p className="font-bold text-foreground leading-none">{session?.user?.name || "Admin"}</p>
                </div>
            </button>

            {/* Profile Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-card border border-border rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Akun</p>
                        <p className="text-xs font-medium truncate text-foreground">{session?.user?.email}</p>
                    </div>
                    <Link href="/dashboard/profile" className="flex items-center px-3 py-1.5 text-xs text-foreground hover:bg-muted/50 transition-colors rounded mx-1 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none">
                        <User size={14} className="mr-2" />
                        Profil
                    </Link>
                    {session?.user?.role === "admin" && (
                        <Link href="/admin" className="flex items-center px-3 py-1.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors rounded mx-1 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none">
                            <ShieldCheck size={14} className="mr-2" />
                            Admin
                        </Link>
                    )}
                    <div className="h-[1px] bg-border my-1.5"></div>
                    <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors rounded mx-1 focus-visible:ring-2 focus-visible:ring-destructive/20 focus-visible:border-destructive/50 outline-none"
                    >
                        <LogOut size={14} className="mr-2" />
                        Keluar
                    </button>
                </div>
            )}
        </div>
    );
}
