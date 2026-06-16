"use client";

import React from "react";
import Link from "next/link";
import { Edit, Trash2, Tag, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
    TableContainer, 
    THead, 
    TBody, 
    TR, 
    TH, 
    TD 
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

type Taxonomy = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    _count: {
        terms: number;
    };
};

export default function TaxonomyList({ taxonomies }: { taxonomies: Taxonomy[] }) {
    const router = useRouter();

    return (
        <>
            <TableContainer>
                <THead>
                    <TR>
                        <TH>Nama</TH>
                        <TH>Slug</TH>
                        <TH>Jumlah Item</TH>
                        <TH align="right">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {taxonomies.length === 0 ? (
                        <TR>
                            <TD colSpan={4} className="p-0 border-none">
                                <EmptyState 
                                    icon={<Layers size={32} />} 
                                    message="Belum ada kategori atau tag." 
                                    className="py-24"
                                />
                            </TD>
                        </TR>
                    ) : (
                        taxonomies.map((tax) => (
                            <TR key={tax.id}>
                                <TD>
                                    <div className="flex items-center gap-4 py-1">
                                        <div className="w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Tag size={18} />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-foreground uppercase tracking-tight">{tax.name}</div>
                                            <div className="text-[10px] text-muted-foreground font-medium opacity-60 line-clamp-1">{tax.description || "Tanpa deskripsi"}</div>
                                        </div>
                                    </div>
                                </TD>
                                <TD className="text-[10px] font-black font-mono text-muted-foreground/60 uppercase tracking-widest">
                                    {tax.slug}
                                </TD>
                                <TD className="text-[10px] text-foreground font-black uppercase tracking-widest">
                                    <span className="text-primary">{tax._count.terms}</span> <span className="opacity-40">item</span>
                                </TD>
                                <TD align="right">
                                    <div className="flex justify-end gap-3 items-center">
                                        <Link 
                                            href={`/dashboard/taxonomies/${tax.id}/terms`} 
                                            className="px-3 py-1.5 bg-muted/10 border border-border rounded-lg text-[9px] font-black text-foreground uppercase tracking-widest hover:bg-muted/20 transition-all active:scale-95"
                                        >
                                            Kelola Isi
                                        </Link>
                                        <Link href={`/dashboard/taxonomies/${tax.id}`} className="p-2 text-muted-foreground hover:text-primary transition-all rounded-lg hover:bg-primary/5">
                                            <Edit size={14} />
                                        </Link>
                                        <ConfirmActionButton
                                            icon={<Trash2 size={14} />}
                                            title="Delete Taxonomy"
                                            confirmTitle="Hapus Kategori?"
                                            confirmMessage={`Apakah Anda yakin ingin menghapus "${tax.name}"? Tindakan ini akan menghapus semua term di dalamnya.`}
                                            confirmText="Ya, Hapus"
                                            variant="danger"
                                            onConfirm={async () => {
                                                try {
                                                    const res = await fetch(`/api/taxonomies/${tax.id}`, {
                                                        method: "DELETE",
                                                    });
                                                    if (res.ok) {
                                                        router.refresh();
                                                        toast.success("Taksonomi berhasil dihapus");
                                                    } else {
                                                        toast.error("Gagal menghapus taksonomi");
                                                    }
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Terjadi kesalahan saat menghapus");
                                                }
                                            }}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                        />
                                    </div>
                                </TD>
                            </TR>
                        ))
                    )}
                </TBody>
            </TableContainer>
        </>
    );
}
