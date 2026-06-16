"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

interface DeleteProductButtonProps {
    productId: string;
    productName: string;
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
    const router = useRouter();

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal menghapus produk");
            }

            router.refresh();
        } catch (error) {
            alert((error as Error).message);
            console.error(error);
        }
    };

    return (
        <ConfirmActionButton
            icon={<Trash2 size={14} />}
            title="Hapus Permanen"
            confirmTitle="Hapus Produk Permanen?"
            confirmMessage={`Apakah Anda yakin ingin menghapus "${productName}"? Tindakan ini tidak dapat dibatalkan.`}
            confirmText="Ya, Hapus"
            onConfirm={handleDelete}
            className="bg-muted/20 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-all border border-border hover:border-red-500/20"
        />
    );
}
