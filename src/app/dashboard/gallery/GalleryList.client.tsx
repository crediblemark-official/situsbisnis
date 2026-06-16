"use client";

import React from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { getProxiedUrl } from "@/lib/media/utils";

type GalleryItem = {
    id: string;
    title: string;
    url: string;
    description: string;
    createdAt: string;
};

export default function GalleryList({ items }: { items: GalleryItem[] }) {
    const router = useRouter();

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Aset berhasil dihapus");
                router.refresh();
            } else {
                toast.error("Gagal menghapus aset");
            }
        } catch (_e) {
            toast.error("Terjadi kesalahan saat menghapus");
        }
    };

    if (items.length === 0) {
        return (
            <EmptyState
                icon={<Trash2 size={48} className="opacity-10" />}
                message="Belum ada foto di galeri. Mulai unggah aset pertama Anda."
                className="py-32"
            />
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map(item => (
                <div key={item.id} className="group relative bg-card rounded-xl border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                    <div className="aspect-square bg-muted/5 relative overflow-hidden">
                        <Image src={getProxiedUrl(item.url)} alt={item.title || "Gallery image"} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <ConfirmActionButton
                                icon={<Trash2 size={16} />}
                                title="Hapus Aset"
                                confirmTitle="Hapus Aset Visual?"
                                confirmMessage={`Hapus "${item.title || 'item'}" dari arsip galeri?`}
                                confirmText="Ya, Hapus"
                                variant="danger"
                                onConfirm={() => handleDelete(item.id)}
                                className="w-10 h-10 flex items-center justify-center bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all shadow-xl active:scale-95"
                            />
                        </div>
                    </div>
                    <div className="p-3 bg-card border-t border-border/30">
                        <p className="text-[10px] font-bold text-foreground uppercase tracking-tight truncate leading-none" title={item.title}>
                            {item.title || "Tanpa Nama"}
                        </p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1.5 opacity-40 truncate">
                            {item.description || "Tanpa deskripsi"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
