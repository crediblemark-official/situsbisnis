"use client";

import React, { useEffect, useRef, useState } from "react";
import Portal from "./Portal";
import { UserPlus, X, Loader2 } from "lucide-react";
import { checkUserEmailExistsAction } from "@/modules/infrastructure/public-actions";

interface AssignOwnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (email: string) => Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export function AssignOwnerModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Hubungkan",
    cancelText = "Batal",
    loading = false
}: AssignOwnerModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [emailExists, setEmailExists] = useState<boolean | null>(null);
    const [registeredName, setRegisteredName] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEmail("");
            setError("");
            setEmailExists(null);
            setRegisteredName(null);
            setIsValidating(false);
            previousFocusRef.current = document.activeElement as HTMLElement;

            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusableElements && focusableElements.length > 0) {
                const emailInput = Array.from(focusableElements).find(
                    (el) => (el as HTMLInputElement).type === "email"
                ) as HTMLElement;
                if (emailInput) {
                    emailInput.focus();
                }
            }

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
                        if (document.activeElement === firstEl) {
                            lastEl.focus();
                            e.preventDefault();
                        }
                    } else {
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
                if (previousFocusRef.current) {
                    previousFocusRef.current.focus();
                }
            };
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const trimmedEmail = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            setEmailExists(null);
            setRegisteredName(null);
            setIsValidating(false);
            return;
        }

        setIsValidating(true);
        const timer = setTimeout(async () => {
            try {
                const res = await checkUserEmailExistsAction(trimmedEmail);
                if (res.success) {
                    setEmailExists(res.exists);
                    setRegisteredName(res.userName);
                } else {
                    setEmailExists(false);
                    setRegisteredName(null);
                }
            } catch (err) {
                console.error("Error validating email:", err);
                setEmailExists(null);
                setRegisteredName(null);
            } finally {
                setIsValidating(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [email, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) {
            setError("Email wajib diisi");
            return;
        }
        if (emailExists === false) {
            setError("Email tidak terdaftar");
            return;
        }
        try {
            await onConfirm(email.trim());
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan");
        }
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
                    className="relative w-full max-w-sm bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
                >
                    <form onSubmit={handleSubmit}>
                        {/* Header with Icon */}
                        <div className="p-5 pb-2 flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-primary/10 text-primary">
                                <UserPlus size={20} />
                            </div>
                            <h3 id="modal-title" className="text-sm font-black text-foreground uppercase tracking-widest leading-none mb-2">{title}</h3>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight leading-relaxed opacity-60">
                                {message}
                            </p>
                        </div>

                        {/* Form Content */}
                        <div className="px-5 py-3 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block">
                                    Email Pemilik Baru
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="Masukkan email terdaftar..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/45 text-foreground"
                                />
                                <div className="min-h-[16px] pt-1">
                                    {isValidating && (
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide animate-pulse">
                                            Memverifikasi email...
                                        </p>
                                    )}
                                    {!isValidating && emailExists === false && (
                                        <p className="text-[9px] font-bold text-destructive uppercase tracking-wide">
                                            ✗ Email tidak terdaftar dalam database
                                        </p>
                                    )}
                                    {!isValidating && emailExists === true && (
                                        <p className="text-[9px] font-bold text-green-500 uppercase tracking-wide">
                                            ✓ Pemilik ditemukan: {registeredName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {error && (
                                <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-3 bg-muted/5 border-t border-border/50 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-1.5 bg-muted/10 text-foreground border border-border/50 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-muted/20 transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || isValidating || emailExists !== true}
                                className="px-4 py-1.5 bg-primary shadow-primary/20 text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                            >
                                {loading && <Loader2 className="animate-spin" size={12} />}
                                {confirmText}
                            </button>
                        </div>
                    </form>

                    {/* Close Icon (Top Right) */}
                    <button
                        type="button"
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
