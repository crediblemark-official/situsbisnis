"use client";

import React, { useEffect, useRef } from "react";
import Portal from "./Portal";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary" | "warning";
    loading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    variant = "primary",
    loading = false
}: ConfirmationModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Record current focus element for focus restoration upon close
            previousFocusRef.current = document.activeElement as HTMLElement;

            // Automatically place focus inside the modal on mount
            // We want to focus the cancel button first for non-destructive safety
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements && focusableElements.length > 0) {
                const cancelBtn = Array.from(focusableElements).find(
                    (el) => el.textContent === cancelText
                ) as HTMLElement;
                if (cancelBtn) {
                    cancelBtn.focus();
                } else {
                    (focusableElements[0] as HTMLElement).focus();
                }
            }

            // Keyboard listeners for Escape closing and focus trap
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    onClose();
                    return;
                }

                if (e.key === "Tab") {
                    if (!modalRef.current) return;
                    const focusables = modalRef.current.querySelectorAll(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (focusables.length === 0) return;

                    const firstEl = focusables[0] as HTMLElement;
                    const lastEl = focusables[focusables.length - 1] as HTMLElement;

                    if (e.shiftKey) {
                        // Shift + Tab -> Wrap to last element if on first
                        if (document.activeElement === firstEl) {
                            lastEl.focus();
                            e.preventDefault();
                        }
                    } else {
                        // Tab -> Wrap to first element if on last
                        if (document.activeElement === lastEl) {
                            firstEl.focus();
                            e.preventDefault();
                        }
                    }
                }
            };

            document.addEventListener("keydown", handleKeyDown);
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
                // Restore focus back to original trigger button
                if (previousFocusRef.current) {
                    previousFocusRef.current.focus();
                }
            };
        }
    }, [isOpen, onClose, cancelText]);

    if (!isOpen) return null;

    const variantStyles = {
        primary: "bg-primary/10 text-primary",
        danger: "bg-destructive/10 text-destructive",
        warning: "bg-amber-500/10 text-amber-600"
    };

    const buttonStyles = {
        primary: "bg-primary shadow-primary/20",
        danger: "bg-destructive shadow-destructive/20",
        warning: "bg-amber-600 shadow-amber-600/20"
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <div 
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    aria-describedby="modal-message"
                    className={`relative w-full max-w-sm bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300`}
                >
                    {/* Header with Icon */}
                    <div className="p-5 pb-2 flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${variantStyles[variant]}`}>
                            <AlertCircle size={20} />
                        </div>
                        <h3 id="modal-title" className="text-sm font-black text-foreground uppercase tracking-widest leading-none mb-2">{title}</h3>
                        <p id="modal-message" className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight leading-relaxed opacity-60">
                            {message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="p-3 bg-muted/5 border-t border-border/50 grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 bg-muted/10 text-foreground border border-border/50 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-muted/20 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                if (!loading) {
                                    onConfirm();
                                }
                            }}
                            disabled={loading}
                            className={`px-4 py-1.5 ${buttonStyles[variant]} ${variant === 'primary' ? 'text-primary-foreground' : 'text-white'} rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/20`}
                        >
                            {loading && <Loader2 className="animate-spin" size={12} />}
                            {confirmText}
                        </button>
                    </div>

                    {/* Close Icon (Top Right) */}
                    <button
                        onClick={onClose}
                        aria-label="Tutup"
                        className="absolute top-3 right-3 text-muted-foreground/40 hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </Portal>
    );
}
