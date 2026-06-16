"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { EditorSidebar } from "@/components/dashboard/EditorSidebar";
import { Button } from "@/components/ui/Button";

interface EditorLayoutProps {
    title: string;
    description?: string;
    backUrl: string;
    isSaving: boolean;
    onSubmit: (_e: React.FormEvent) => void;
    children: React.ReactNode;
    sidebarContent?: React.ReactNode;
    isSidebarOpen: boolean;
    onSidebarOpenChange: (_isOpen: boolean) => void;
    headerActions?: React.ReactNode;
}

export function EditorLayout({
    title,
    description,
    backUrl,
    isSaving,
    onSubmit,
    children,
    sidebarContent,
    isSidebarOpen,
    onSidebarOpenChange,
    headerActions
}: EditorLayoutProps) {
    return (
        <form onSubmit={onSubmit} className="w-full animate-in fade-in duration-700 pb-20 space-y-4">
            <div className="sticky top-0 z-[40] bg-background/95 backdrop-blur-sm -mx-3 md:-mx-5 px-3 md:px-5 py-2 border-b border-border/50 flex items-center justify-between mb-0 md:mb-4 transition-all duration-300 gap-4">
                <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <Link href={backUrl} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-md transition-all flex-shrink-0">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-base md:text-lg font-bold text-foreground tracking-tight truncate">
                            {title}
                        </h1>
                        {description && (
                            <p className="hidden md:block text-[10px] font-bold text-muted-foreground truncate">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {headerActions}
                    {sidebarContent && (
                        <button
                            type="button"
                            onClick={() => onSidebarOpenChange(true)}
                            className="lg:hidden p-2 text-muted-foreground hover:bg-muted/10 rounded-md transition-all"
                        >
                            <Settings size={20} />
                        </button>
                    )}
                    <Button
                        type="submit"
                        loading={isSaving}
                        icon={<Save size={14} />}
                        className="md:px-6 shadow-lg shadow-primary/20"
                    >
                        Simpan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 space-y-4">
                    {children}
                </div>

                {sidebarContent && (
                    <div className="lg:col-span-1">
                        <EditorSidebar isOpen={isSidebarOpen} onClose={() => onSidebarOpenChange(false)}>
                            {sidebarContent}
                        </EditorSidebar>
                    </div>
                )}
            </div>
        </form>
    );
}
