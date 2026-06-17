"use client";

import React from "react";
import Link from "next/link";
import { 
    Edit, 
    Trash2, 
    ExternalLink, 
    LayoutPanelLeft, 
    FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deletePageAction } from "@/modules/page";

import { 
    TableContainer,
    THead,
    TBody,
    TR,
    TH,
    TD 
} from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

type Page = {
    id: string;
    path: string;
    title?: string;
    description?: string;
    isPublished: boolean;
    useBuilder: boolean;
};

export default function PageList({ pages }: { pages: Page[] }) {
    const router = useRouter();

    const deletePage = async (id: string) => {
        try {
            const data = await deletePageAction(id);

            if (data.success) {
                toast.success("Halaman berhasil dihapus");
                router.refresh();
            } else {
                toast.error(data.error || "Gagal menghapus halaman");
            }
        } catch (_e) {
            toast.error("Terjadi kesalahan saat menghapus halaman");
        }
    };

    return (
        <TableContainer>
            <THead>
                <TR>
                    <TH>Tipe</TH>
                    <TH>Judul</TH>
                    <TH>Alamat</TH>
                    <TH align="center">Status</TH>
                    <TH align="right">Aksi</TH>
                </TR>
            </THead>
            <TBody>
                {pages.length === 0 ? (
                    <TR>
                        <TD colSpan={5} className="py-20">
                            <EmptyState 
                                icon={<LayoutPanelLeft size={32} />} 
                                message="Belum ada halaman yang dibuat." 
                            />
                        </TD>
                    </TR>
                ) : (
                    pages.map((page) => (
                        <TR key={page.id} className="group/row">
                            <TD>
                                <div className="flex items-center gap-4 py-1">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center border transition-all shadow-inner shrink-0 ${page.useBuilder ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted/5 border-border text-muted-foreground'}`}>
                                        {page.useBuilder ? <LayoutPanelLeft size={16} /> : <FileText size={16} />}
                                    </div>
                                    <div className="hidden xs:block">
                                        <StatusBadge 
                                            type={page.useBuilder ? "primary" : "neutral"} 
                                            label={page.useBuilder ? "Visual" : "Biasa"} 
                                            className="text-[8px] font-black px-1.5 py-0.5"
                                        />
                                    </div>
                                </div>
                            </TD>
                            <TD noWrap={false} className="max-w-[120px] md:max-w-[300px]">
                                <div className="text-[11px] font-black text-foreground tracking-tight group-hover/row:text-primary transition-colors break-words">{page.title || "Tanpa Judul"}</div>
                                <div className="text-[9px] text-muted-foreground mt-1 break-words font-medium opacity-60 italic hidden sm:block">{page.description || "Tanpa deskripsi"}</div>
                            </TD>
                            <TD>
                                <code className="text-[10px] font-black font-mono text-primary/60 tracking-tight">
                                    {page.path}
                                </code>
                            </TD>
                            <TD align="center">
                                <StatusBadge 
                                    type={page.isPublished ? "success" : "neutral"} 
                                    label={page.isPublished ? "Aktif" : "Draft"} 
                                />
                            </TD>
                            <TD align="right">
                                <div className="flex justify-end gap-1.5 items-center lg:opacity-40 lg:group-hover/row:opacity-100 opacity-100 transition-opacity">
                                    <Link href={page.path} target="_blank" className="p-1.5 text-muted-foreground hover:text-primary transition-all rounded hover:bg-primary/5" title="View Interface">
                                        <ExternalLink size={14} />
                                    </Link>
                                    <Link href={`/dashboard/pages/${page.id}`} className="p-1.5 text-muted-foreground hover:text-foreground transition-all rounded hover:bg-muted/10" title="Edit Halaman">
                                        <Edit size={14} />
                                    </Link>
                                    <ConfirmActionButton 
                                        icon={<Trash2 size={14} />}
                                        title="Purge Node"
                                        confirmTitle="Purge Architectural Node?"
                                        confirmMessage={`Deleting ${page.path} is permanent and will remove all associated content from the global matrix. Proceed?`}
                                        confirmText="Ya, Hapus"
                                        variant="danger"
                                        onConfirm={() => deletePage(page.id)}
                                    />
                                </div>
                            </TD>
                        </TR>
                    ))
                )}
            </TBody>
        </TableContainer>
    );
}
