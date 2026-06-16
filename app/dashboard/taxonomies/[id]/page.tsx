"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Layers, Loader2, Info, Trash2 } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection, FormInput, FormTextArea } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";


export default function EditTaxonomyPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: ""
    });

    useEffect(() => {
        let ignore = false;

        const fetchTaxonomy = async () => {
            try {
                const res = await fetch(`/api/taxonomies/${id}`);
                if (!res.ok) throw new Error("Failed to fetch taxonomy");
                const result = await res.json();
                const data = result.data || result;
                
                if (!ignore) {
                    setForm({
                        name: data.name || "",
                        slug: data.slug || "",
                        description: data.description || ""
                    });
                    setFetching(false);
                }
            } catch (err) {
                if (!ignore) {
                    console.error(err);
                    setError("Gagal memuat data taksonomi.");
                    setFetching(false);
                }
            }
        };
        
        fetchTaxonomy();
        return () => { ignore = true; };
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/taxonomies/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Gagal memperbarui taksonomi");
            }

            router.push("/dashboard/taxonomies");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/taxonomies/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus taksonomi");
            setShowDeleteModal(false);
            router.push("/dashboard/taxonomies");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    if (fetching) {
        return (
            <div className="space-y-6 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
                <div className="h-8 w-32 bg-muted/10 rounded-xl animate-pulse" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard/taxonomies" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={16} />
                </Link>
                <span className="text-[10px] font-bold text-muted-foreground">Kembali ke Daftar</span>
            </div>

            <PageHeader 
                title={`Edit Kategori: ${form.name}`} 
                subtitle="Perbarui identitas atau metadata kategori Anda."
                icon={<Layers />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Action Area (Form) */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold flex items-center gap-2">
                                <Info size={14} /> {error}
                            </div>
                        )}

                        <FormSection title="Detail Kategori" description="Perbarui nama dan identitas kategori Anda.">
                            <div className="space-y-6">
                                <FormInput
                                    label="Nama Kategori"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({...form, name: e.target.value})}
                                    placeholder="Contoh: Elektronik, Berita, dll"
                                />

                                <FormInput
                                    label="Slug (URL)"
                                    required
                                    value={form.slug}
                                    onChange={(e) => setForm({...form, slug: e.target.value})}
                                    placeholder="kategori-utama"
                                    className="font-mono text-primary"
                                />

                                <FormTextArea
                                    label="Deskripsi"
                                    value={form.description}
                                    onChange={(e) => setForm({...form, description: e.target.value})}
                                    placeholder="Penjelasan singkat kategori ini..."
                                    rows={4}
                                />
                            </div>

                            <div className="pt-6 flex justify-between items-center">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(true)}
                                    className="flex items-center justify-center px-6 py-3 bg-red-500/5 text-red-500 border border-red-500/10 rounded-2xl hover:bg-red-500 hover:text-white text-[10px] font-black transition-all"
                                >
                                    <Trash2 className="mr-2" size={14} />
                                    Hapus
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center px-10 py-3 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 disabled:opacity-50 text-[11px] font-black transition-all shadow-xl shadow-primary/20 group"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-3" size={16} /> : <Save className="mr-3 group-hover:scale-110 transition-transform" size={16} />}
                                    Perbarui Kategori
                                </button>
                            </div>
                        </FormSection>
                    </form>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                        <h4 className="text-[10px] font-black text-primary flex items-center gap-2">
                            <Info size={14} /> Informasi
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                            Perubahan pada <span className="font-bold">Slug</span> mungkin akan mempengaruhi URL halaman publik yang menggunakan kategori ini. Pastikan untuk melakukan redirect jika diperlukan demi menjaga SEO.
                        </p>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Kategori?"
                message="Apakah Anda yakin ingin menghapus taksonomi ini? Semua term di dalamnya juga akan terpengaruh."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />
        </div>
    );
}
