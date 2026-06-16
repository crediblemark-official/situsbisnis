"use client";

import React from "react";

interface EditorSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function EditorSidebar({ isOpen, onClose, children }: EditorSidebarProps) {
    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-4 sticky top-20 self-start">
                <div className="bg-card rounded-md border border-border/50 p-3 shadow-sm">
                    {children}
                </div>
            </div>

            {/* Mobile Drawer */}
            <div 
                className={`
                    fixed inset-0 z-[100] lg:hidden transition-all duration-500
                    ${isOpen ? "visible" : "invisible"}
                `}
            >
                {/* Backdrop */}
                <div 
                    className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={onClose}
                />
                
                {/* Drawer Content */}
                <div 
                    className={`
                        absolute bottom-0 left-0 right-0 bg-card border-t border-border/50 rounded-t-lg p-4 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] transition-transform duration-500 ease-out
                        ${isOpen ? "translate-y-0" : "translate-y-full"}
                    `}
                >
                    {/* Handle */}
                    <div className="w-12 h-1 bg-border/50 rounded-full mx-auto mb-5 cursor-pointer" onClick={onClose} />
                    
                    <div className="max-h-[80vh] overflow-y-auto pb-6 custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}
