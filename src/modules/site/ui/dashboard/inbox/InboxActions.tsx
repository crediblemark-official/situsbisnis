"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

export default function InboxActions({ id }: { id: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/contact/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Pesan dihapus");
                router.refresh();
            } else {
                toast.error("Gagal menghapus pesan");
            }
        } catch (_e) {
            toast.error("Terjadi kesalahan");
        }
    };

    return (
        <ConfirmActionButton
            icon={<Trash2 size={14} />}
            title="Hapus"
            confirmTitle="Hapus Pesan?"
            confirmMessage="Pesan ini akan dihapus secara permanen dari kotak masuk."
            confirmText="Hapus"
            variant="danger"
            onConfirm={handleDelete}
            className="p-1.5 bg-muted/20 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all border border-border hover:border-red-500/20 shadow-sm"
        />
    );
}

