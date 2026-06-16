"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Edit, Trash2, Newspaper, Eye, Loader2 } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

type Post = {
    id: string;
    title: string;
    slug: string;
    published: boolean;
    createdAt: Date | string;
    author?: {
        name: string | null;
    } | null;
    metaData?: {
        key: string;
        value: string | null;
    }[];
};

export default function PostList({ posts }: { posts: Post[] }) {
    const router = useRouter();
    const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Fetch dynamic categories from Site Taxonomies where slug = "category"
    React.useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetch("/api/taxonomies");
                if (!res.ok) throw new Error("Gagal mengambil taksonomi");
                const taxRes = await res.json();
                const taxonomies = taxRes.data || taxRes;
                
                if (Array.isArray(taxonomies)) {
                    let categoryTax = taxonomies.find(
                        (t: any) => t.slug === "category" || t.name?.toLowerCase() === "category" || t.name?.toLowerCase() === "kategori"
                    );
                    
                    if (!categoryTax && taxonomies.length > 0) {
                        categoryTax = taxonomies[0];
                    }
                    
                    if (categoryTax) {
                        const termsRes = await fetch(`/api/taxonomies/${categoryTax.id}/terms`);
                        if (termsRes.ok) {
                            const termsData = await termsRes.json();
                            const terms = termsData.data || termsData;
                            if (Array.isArray(terms)) {
                                const names = terms.map((term: any) => term.name);
                                setCategories(names);
                                setLoadingCategories(false);
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading dynamic categories in PostList:", err);
            }
            
            // Empty array if no taxonomy or terms found. NO hardcoded fallbacks!
            setCategories([]);
            setLoadingCategories(false);
        };
        
        loadCategories();
    }, []);

    const getPostCategory = (post: Post) => {
        const categoryMeta = post.metaData?.find((m) => m.key === "category");
        return categoryMeta?.value || "";
    };

    const handleCategoryChange = async (post: Post, newCategory: string) => {
        if (!newCategory) return;
        setUpdatingPostId(post.id);
        const loadingToast = toast.loading(`Mengubah kategori menjadi "${newCategory}"...`);
        const finalCategory = newCategory;

        try {
            // 1. Fetch current post detail to get all data (content, imageUrl, etc.)
            const res = await fetch(`/api/posts/${post.id}`);
            if (!res.ok) throw new Error("Gagal mengambil data lengkap artikel");
            const data = await res.json();

            // 2. Prepare updated metadata array
            const newMetaData = [...(data.metaData || [])];
            const index = newMetaData.findIndex((m: any) => m.key === "category");
            if (index > -1) {
                newMetaData[index] = { ...newMetaData[index], value: finalCategory };
            } else {
                newMetaData.push({ key: "category", value: finalCategory, type: "text" });
            }

            // 3. Send PUT request
            const putRes = await fetch(`/api/posts/${post.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: data.title,
                    slug: data.slug,
                    imageUrl: data.imageUrl || "",
                    content: data.content ? (typeof data.content === 'string' ? data.content : JSON.stringify(data.content)) : "",
                    status: data.published ? "published" : "draft",
                    excerpt: data.excerpt || "",
                    metaData: newMetaData
                })
            });

            if (!putRes.ok) throw new Error("Gagal menyimpan kategori");

            toast.success("Kategori berhasil diperbarui", { id: loadingToast });
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Gagal memperbarui kategori", { id: loadingToast });
        } finally {
            setUpdatingPostId(null);
        }
    };

    return (
        <>
            <TableContainer>
                <THead>
                    <TR>
                        <TH>Artikel</TH>
                        <TH align="center">Status</TH>
                        <TH>Kategori</TH>
                        <TH>Tanggal</TH>
                        <TH align="right" className="w-24">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {posts.length === 0 ? (
                        <TR>
                            <TD colSpan={5} className="py-20">
                                <EmptyState 
                                    icon={<Newspaper size={32} />} 
                                    message="Belum ada artikel. Siap menulis karya pertama Anda?" 
                                />
                            </TD>
                        </TR>
                    ) : (
                        posts.map((post) => {
                            const currentCategory = getPostCategory(post);
                            const isUpdating = updatingPostId === post.id;

                            return (
                                <TR key={post.id} className="group/row">
                                    <TD>
                                        <div className="py-1">
                                            <div className="text-[11px] font-black text-foreground tracking-tight uppercase group-hover/row:text-primary transition-colors">{post.title}</div>
                                            <div className="text-[9px] text-muted-foreground mt-1 font-mono opacity-40 italic tracking-tighter">NODE_URI://{post.slug}</div>
                                        </div>
                                    </TD>
                                    <TD align="center">
                                        <StatusBadge 
                                            type={post.published ? "success" : "neutral"} 
                                            label={post.published ? "Terbit" : "Draft"} 
                                        />
                                    </TD>
                                    <TD>
                                        <div className="flex items-center gap-2">
                                            {isUpdating ? (
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Loader2 size={12} className="animate-spin text-primary" />
                                                    <span>Saving...</span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={currentCategory}
                                                    onChange={(e) => handleCategoryChange(post, e.target.value)}
                                                    disabled={isUpdating || loadingCategories}
                                                    className="bg-muted/10 border border-border/50 rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-muted/20 focus:outline-none focus:border-primary/50 transition-colors shadow-inner outline-none cursor-pointer"
                                                >
                                                    <option value="">-- Pilih Kategori --</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat} value={cat}>
                                                            {cat}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </TD>
                                    <TD className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                        {new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </TD>
                                    <TD align="right">
                                        <div className="flex justify-end gap-1.5 items-center lg:opacity-40 lg:group-hover/row:opacity-100 opacity-100 transition-opacity">
                                            <Link 
                                                href={`/blog/${post.slug}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-xl transition-all" 
                                                title="Lihat Artikel"
                                            >
                                                <Eye size={14} />
                                            </Link>
                                            <Link href={`/dashboard/posts/${post.id}`} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/10 rounded-xl transition-all" title="Edit Article">
                                                <Edit size={14} />
                                            </Link>
                                            <ConfirmActionButton
                                                icon={<Trash2 size={14} />}
                                                title="Purge Node"
                                                confirmTitle="Hapus Artikel?"
                                                confirmMessage={`Apakah Anda yakin ingin menghapus "${post.title}"? Tindakan ini tidak dapat dibatalkan.`}
                                                confirmText="Ya, Hapus"
                                                variant="danger"
                                                onConfirm={async () => {
                                                    try {
                                                        const res = await fetch(`/api/posts/${post.id}`, {
                                                            method: "DELETE",
                                                        });
                                                        if (res.ok) {
                                                            router.refresh();
                                                            toast.success("Artikel berhasil dihapus");
                                                        } else {
                                                            toast.error("Gagal menghapus artikel");
                                                        }
                                                    } catch (error) {
                                                        console.error(error);
                                                        toast.error("Terjadi kesalahan saat menghapus");
                                                    }
                                                }}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                            />
                                        </div>
                                    </TD>
                                </TR>
                            );
                        })
                    )}
                </TBody>
            </TableContainer>
        </>
    );
}
