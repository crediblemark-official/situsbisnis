"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, Tag, Layers, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection, FormInput, FormTextArea } from "@/components/ui/Form";
import { Skeleton } from "@/components/ui/Skeleton";

interface Taxonomy {
    id: string;
    name: string;
    slug: string;
    description: string | null;
}

export default function NewTaxonomyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState("");
    const [existingTaxonomies, setExistingTaxonomies] = useState<Taxonomy[]>([]);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: ""
    });

    useEffect(() => {
        let ignore = false;

        const fetchTaxonomies = async () => {
            try {
                const res = await fetch("/api/taxonomies");
                const result = await res.json();
                if (!ignore) {
                    // CRUD Handler returns { data: [], pagination: {} }
                    setExistingTaxonomies(result.data || []);
                    setListLoading(false);
                }
            } catch {
                if (!ignore) {
                    console.error("Failed to fetch existing taxonomies");
                    setListLoading(false);
                }
            }
        };
        
        fetchTaxonomies();
        return () => { ignore = true; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/taxonomies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create taxonomy");
            }

            router.push("/dashboard/taxonomies");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
            <PageHeader 
                title="Buat Kategori" 
                subtitle="Buat pengelompokan konten baru seperti Kategori, Tag, atau Brand."
                icon={<Layers />}
            >
                <Link href="/dashboard/taxonomies" className="px-3 md:px-4 py-1.5 bg-muted/10 border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-muted/20 transition-all flex items-center gap-2">
                    <ChevronLeft size={14} /> <span className="hidden md:inline">Kembali</span>
                </Link>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Action Area (Form) */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> {error}
                            </div>
                        )}

                        <FormSection title="Detail Kategori" description="Masukkan nama dan identitas kategori Anda.">
                            <div className="space-y-6">
                                <FormInput
                                    label="Nama Kategori"
                                    required
                                    value={form.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setForm({
                                            ...form,
                                            name,
                                            slug: form.slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
                                        });
                                    }}
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

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center px-10 py-3 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 disabled:opacity-50 text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 group"
                                >
                                    {loading ? <Loader2 className="animate-spin mr-3" size={16} /> : <Save className="mr-3 group-hover:scale-110 transition-transform" size={16} />}
                                    Simpan Kategori
                                </button>
                            </div>
                        </FormSection>
                    </form>
                </div>

                {/* Information Rail (Sidebar List) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                    <div className="p-5 bg-muted/5 border border-border/40 rounded-2xl space-y-4">
                        <div>
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-[0.15em] flex items-center gap-2">
                                <Tag size={12} className="text-primary" /> Kategori Terdaftar
                            </h4>
                        </div>

                        <div className="space-y-2">
                            {listLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                                ))
                            ) : existingTaxonomies.length === 0 ? (
                                <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">No active taxonomies</p>
                                </div>
                            ) : (
                                existingTaxonomies.map((tax) => (
                                    <div key={tax.id} className="px-3.5 py-2.5 bg-background/50 border border-border/50 rounded-xl hover:border-primary/30 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{tax.name}</span>
                                            <span className="text-[9px] font-mono text-muted-foreground/40 italic">/{tax.slug}</span>
                                        </div>
                                        {tax.description && (
                                            <p className="text-[9px] text-muted-foreground line-clamp-1 opacity-60 mt-0.5 font-medium">{tax.description}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-3 border-t border-border/40">
                            <div className="p-3 bg-primary/5 rounded-xl flex gap-2.5">
                                <div className="text-primary/60 shrink-0">
                                    <Info size={12} />
                                </div>
                                <p className="text-[9px] text-muted-foreground font-medium leading-relaxed">
                                    Slug akan otomatis disesuaikan untuk kebutuhan SEO.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
