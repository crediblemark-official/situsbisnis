"use client";

import React, { useState, useEffect } from "react";
import { FormSection, FormInput, FormTextArea } from "@/components/ui/Form";
import { 
    TableContainer, 
    THead, 
    TBody, 
    TR, 
    TH, 
    TD 
} from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Trash2, Tag, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { slugify } from "@/lib/utils/string";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";

type Term = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
};

export default function TermsClient({ taxonomyId }: { taxonomyId: string }) {
    const [terms, setTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: ""
    });

    // Track previous taxonomyId to reset loading state when it changes
    const [prevTaxonomyId, setPrevTaxonomyId] = useState(taxonomyId);
    if (taxonomyId !== prevTaxonomyId) {
        setPrevTaxonomyId(taxonomyId);
        setLoading(true);
    }

    const fetchTerms = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/taxonomies/${taxonomyId}/terms`);
            const data = await res.json();
            setTerms(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [taxonomyId]);

    useEffect(() => {
        let ignore = false;
        
        async function fetchInitialTerms() {
            try {
                const res = await fetch(`/api/taxonomies/${taxonomyId}/terms`);
                const data = await res.json();
                if (!ignore) {
                    setTerms(Array.isArray(data) ? data : []);
                    setLoading(false);
                }
            } catch (error) {
                if (!ignore) {
                    console.error(error);
                    setLoading(false);
                }
            }
        }

        fetchInitialTerms();
        return () => { ignore = true; };
    }, [taxonomyId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch(`/api/taxonomies/${taxonomyId}/terms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setForm({ name: "", slug: "", description: "" });
                await fetchTerms();
                toast.success("Term berhasil ditambahkan");
            } else {
                const data = await res.json();
                toast.error(data.error || "Gagal menambahkan term");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan sistem saat menyimpan");
        } finally {
            setCreating(false);
        }
    };


    if (loading) return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4"><Skeleton className="h-80 w-full" /></div>
            <div className="lg:col-span-8"><Skeleton className="h-80 w-full" /></div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Create Form */}
            <div className="lg:col-span-4 sticky top-6">
                <form onSubmit={handleCreate}>
                    <FormSection 
                        title="Add New Term" 
                        description="Associate a specific identifier with this taxonomy classification."
                    >
                        <div className="space-y-4">
                            <FormInput 
                                label="Name" 
                                value={form.name} 
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    const currentAutoSlug = slugify(form.name);
                                    const shouldUpdateSlug = !form.slug || form.slug === currentAutoSlug;
                                    
                                    setForm({ 
                                        ...form, 
                                        name: newName, 
                                        slug: shouldUpdateSlug ? slugify(newName) : form.slug
                                    });
                                }} 
                                placeholder="e.g. Technology" 
                                required 
                            />
                            <FormInput 
                                label="Slug" 
                                value={form.slug} 
                                onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                                placeholder="technology" 
                                className="font-mono" 
                                required 
                            />
                            <FormTextArea 
                                label="Description" 
                                value={form.description} 
                                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                                placeholder="Optional description..." 
                                rows={3} 
                            />
                            
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-xs font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                {creating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                                Add Term
                            </button>
                        </div>
                    </FormSection>
                </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-8">
                <TableContainer>
                    <THead>
                        <TR>
                            <TH>Term Identifier</TH>
                            <TH>Slug</TH>
                            <TH align="right">Actions</TH>
                        </TR>
                    </THead>
                    <TBody>
                        {terms.length === 0 ? (
                            <TR>
                                <TD colSpan={3} className="p-0 border-none">
                                    <EmptyState 
                                        icon={<Tag size={32} />} 
                                        message={`No terms defined yet. Try adding a new identifier to the left.`} 
                                    />
                                </TD>
                            </TR>
                        ) : (
                            terms.map((term) => (
                                <TR key={term.id}>
                                    <TD>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                                                <Tag size={12} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white tracking-tight">{term.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{term.description || "—"}</div>
                                            </div>
                                        </div>
                                    </TD>
                                    <TD className="text-[11px] font-mono text-gray-500">{term.slug}</TD>
                                    <TD align="right">
                                        <ConfirmActionButton
                                            icon={<Trash2 size={14} />}
                                            title="Delete Term"
                                            confirmTitle="Hapus Term?"
                                            confirmMessage={`Apakah Anda yakin ingin menghapus "${term.name}"?`}
                                            confirmText="Ya, Hapus"
                                            variant="danger"
                                            onConfirm={async () => {
                                                try {
                                                    const res = await fetch(`/api/taxonomies/${taxonomyId}/terms/${term.id}`, {
                                                        method: "DELETE"
                                                    });
                                                    if (res.ok) {
                                                        await fetchTerms();
                                                        toast.success("Term berhasil dihapus");
                                                    } else {
                                                        toast.error("Gagal menghapus term");
                                                    }
                                                } catch (error) {
                                                    console.error(error);
                                                    toast.error("Terjadi kesalahan saat menghapus");
                                                }
                                            }}
                                        />
                                    </TD>
                                </TR>
                            ))
                        )}
                    </TBody>
                </TableContainer>
            </div>

        </div>
    );
}
