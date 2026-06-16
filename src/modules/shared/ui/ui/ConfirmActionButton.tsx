"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { ConfirmationModal } from "./ConfirmationModal";
import { ActionButton } from "./ActionButton";

interface ConfirmActionButtonProps {
    icon: React.ReactNode;
    title: string;
    confirmTitle: string;
    confirmMessage: string;
    confirmText?: string;
    variant?: "danger" | "primary" | "warning";
    onConfirm: () => Promise<void>;
    className?: string;
}

export function ConfirmActionButton({
    icon,
    title,
    confirmTitle,
    confirmMessage,
    confirmText = "Confirm",
    variant = "danger",
    onConfirm,
    className = ""
}: ConfirmActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    };

    return (
        <>
            <ActionButton 
                onClick={() => setIsOpen(true)} 
                title={title} 
                variant={variant === "danger" ? "danger" : "default"}
                className={className}
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin" size={14} /> : icon}
            </ActionButton>

            <ConfirmationModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={handleConfirm}
                title={confirmTitle}
                message={confirmMessage}
                confirmText={confirmText}
                variant={variant}
                loading={loading}
            />
        </>
    );
}
