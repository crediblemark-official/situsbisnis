"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Trash2, 
    Globe
} from "lucide-react";
import toast from "react-hot-toast";

import { FormSection, FormInput } from "@/components/ui/Form";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EditorLayout } from "@/components/dashboard/EditorLayout";
import { FormRichText } from "@/components/ui/FormRichText";


import { createPortfolioItemAction, updatePortfolioItemAction, deletePortfolioItemAction } from "@/modules/media/actions/media.actions";

export default function PortfolioEditor({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || "",
        title: initialData?.title || "",
        category: initialData?.category || "",
        imageUrl: initialData?.imageUrl || "",
        link: initialData?.link || "",
        description: initialData?.description || ""
    });

    const isEditMode = !!initialData?.id;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = isEditMode
                ? await updatePortfolioItemAction(formData.id, formData)
                : await createPortfolioItemAction(formData);

            if (!res.success) throw new Error(res.error || "Gagal menyimpan data");

            toast.success("Portfolio berhasil disimpan");
            router.refresh();
            router.push("/dashboard/portfolios");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            const res = await deletePortfolioItemAction(formData.id);
            if (!res.success) throw new Error(res.error || "Gagal menghapus data");

            toast.success("Portfolio berhasil dihapus");
            router.push("/dashboard/portfolios");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
            setShowDeleteModal(false);
        }
    };

    const sidebarContent = (
        <div className="space-y-4">
            <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Pengaturan Portfolio</h4>
                
                <div className="space-y-1">
                    <label htmlFor="portfolio-category" className="text-[10px] font-semibold text-muted-foreground ml-1">Kategori</label>
                    <input
                        id="portfolio-category"
                        name="category"
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-1.5 bg-background border border-border/50 rounded-lg text-xs text-foreground outline-none focus:border-primary/50 transition-colors shadow-sm"
                        placeholder="Contoh: Web Development"
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="portfolio-link" className="text-[10px] font-semibold text-muted-foreground ml-1">Link Project</label>
                    <div className="relative">
                        <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                        <input
                            id="portfolio-link"
                            name="link"
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border/50 rounded-lg text-xs text-foreground outline-none focus:border-primary/50 transition-colors shadow-sm"
                            placeholder="https://example.com"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-3 border-t border-border/50 space-y-1">
                <FormMediaPicker 
                    label="Gambar Portfolio" 
                    value={formData.imageUrl} 
                    onChange={(val) => setFormData({ ...formData, imageUrl: val })}
                    variant="compact"
                />
            </div>

            {isEditMode && (
                <div className="pt-3 border-t border-border/50">
                    <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-2 bg-red-500/5 border border-red-500/10 text-red-500 rounded-lg text-[9px] font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 opacity-60 hover:opacity-100"
                    >
                        <Trash2 size={11} /> Hapus Portfolio
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <EditorLayout
            title={isEditMode ? `Portfolio: ${formData.title}` : "Buat Portfolio"}
            description={isEditMode ? "Mengedit Portfolio" : "Tambahkan karya terbaik Anda"}
            backUrl="/dashboard/portfolios"
            isSaving={saving}
            onSubmit={handleSave}
            isSidebarOpen={isSidebarOpen}
            onSidebarOpenChange={setIsSidebarOpen}
            sidebarContent={sidebarContent}
        >
            <FormSection 
                title="Detail Karya" 
                description="Berikan judul dan deskripsi lengkap tentang project Anda."
            >
                        <div className="space-y-6">
                            <FormInput 
                                label="Judul Project" 
                                name="title" 
                                required 
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Contoh: Website E-commerce Furniture" 
                            />
                            <FormRichText 
                                label="Deskripsi Lengkap"
                                value={formData.description}
                                onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                            />
                        </div>
            </FormSection>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Portfolio?"
                message="Apakah Anda yakin ingin menghapus portfolio ini secara permanen?"
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />
        </EditorLayout>
    );
}
