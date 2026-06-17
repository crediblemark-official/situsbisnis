"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EditorLayout } from "@/components/dashboard/EditorLayout";
import { FormSection, FormInput } from "@/components/ui/Form";
import { FormRichText } from "@/components/ui/FormRichText";
import { createPageAction } from "@/modules/page";

interface PageEditorProps {
    pageId?: string;
    initialData?: {
        id: string;
        path: string;
        title: string;
        description: string;
        imageUrl: string;
        body: string;
        isPublished: boolean;
        useBuilder: boolean;
        data: any;
        metaData: { key: string; value: string; type: string }[];
    };
}

import { PageSidebar } from "@/components/dashboard/pages/PageSidebar";
import { PageMetadataSection } from "@/components/dashboard/pages/PageMetadataSection";
import { VisualBuilderInfo } from "@/components/dashboard/pages/VisualBuilderInfo";

export default function PageEditor({ pageId, initialData }: PageEditorProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [pathManuallyEdited, setPathManuallyEdited] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || "",
        path: initialData?.path || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        imageUrl: initialData?.imageUrl || "",
        body: initialData?.body || "",
        isPublished: initialData?.isPublished ?? true,
        useBuilder: initialData?.useBuilder ?? false,
        data: initialData?.data || null,
        metaData: initialData?.metaData || [
            { key: "show_gallery", value: "false", type: "text" }
        ]
    });

    const isEditing = !!pageId || !!formData.id;

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "primary";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        variant: "primary"
    });

    const getVisualBuilderPath = (path: string) => {
        return path === "/" ? "/credbuild" : `/credbuild${path}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        if (name === "path") setPathManuallyEdited(true);
        setFormData(prev => {
            const newData = { ...prev, [name]: val };
            if (!isEditing && name === 'title' && !pathManuallyEdited) {
                const slug = (val as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                newData.path = slug ? `/${slug}` : "";
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = await createPageAction(formData);
            if (!data.success) {
                throw new Error(data.error || "Failed to save");
            }
            if (formData.useBuilder && !isEditing) {
                const credbuildPath = formData.path === "/" ? "/credbuild" : `/credbuild${formData.path}`;
                router.push(credbuildPath);
            } else {
                router.push("/dashboard/pages");
            }
            toast.success("Halaman berhasil disimpan");
        } catch (error: any) {
            toast.error(`Gagal menyimpan: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleMode = () => {
        const isPromoting = !formData.useBuilder;
        
        if (!isEditing) {
            setFormData(prev => ({ ...prev, useBuilder: isPromoting }));
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: isPromoting ? "Aktifkan Visual Builder?" : "Nonaktifkan Visual Builder?",
            message: isPromoting ? "Visual Builder akan menggantikan editor teks standar." : "Editor teks standar akan diaktifkan kembali.",
            onConfirm: async () => {
                setSaving(true);
                try {
                    const data = await createPageAction({ ...formData, useBuilder: isPromoting });
                    if (data.success) {
                        if (isPromoting) {
                            const credbuildPath = formData.path === "/" ? "/credbuild" : `/credbuild${formData.path}`;
                            router.push(credbuildPath);
                        } else {
                            setFormData(prev => ({ ...prev, useBuilder: false }));
                        }
                    } else {
                        toast.error(data.error || "Gagal berpindah mode editor");
                    }
                } catch (_e) {
                    toast.error("Gagal berpindah mode editor");
                } finally {
                    setSaving(false);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    return (
        <EditorLayout
            title={isEditing ? "Edit Halaman" : "Buat Halaman"}
            description={isEditing ? formData.path : "Menyiapkan Halaman Baru"}
            backUrl="/dashboard/pages"
            isSaving={saving}
            onSubmit={handleSubmit}
            isSidebarOpen={isSidebarOpen}
            onSidebarOpenChange={setIsSidebarOpen}
            headerActions={
                <button
                    type="button"
                    onClick={handleToggleMode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 hover:bg-muted/60 border border-border/50 text-[9px] font-black uppercase tracking-widest text-foreground rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
                >
                    <span className="flex h-1.5 w-1.5 relative">
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${formData.useBuilder ? 'bg-emerald-500' : 'bg-primary animate-pulse'}`}></span>
                    </span>
                    <span>{formData.useBuilder ? 'Gunakan Editor Standar' : 'Gunakan Visual Editor'}</span>
                </button>
            }
            sidebarContent={
                <PageSidebar 
                    formData={formData}
                    isEditing={isEditing}
                    onChange={handleChange}
                    onSetFormData={setFormData}
                />
            }
        >
            <FormSection 
                title="Detail Halaman" 
                description="Isi judul dan konten untuk halaman Anda."
            >
                <div className="space-y-6">
                    <FormInput 
                        label="Judul" 
                        name="title" 
                        required 
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Masukkan judul halaman..." 
                    />

                    {formData.useBuilder ? (
                        <VisualBuilderInfo 
                            pageId={formData.id}
                            path={formData.path}
                            getVisualBuilderPath={getVisualBuilderPath}
                        />
                    ) : (
                        <FormRichText
                            label="Editor Konten"
                            value={formData.body}
                            minHeight="min-h-[400px]"
                            onChange={(content) => {
                                setFormData(prev => ({ ...prev, body: content }));
                            }}
                        />
                    )}
                </div>
            </FormSection>

            <PageMetadataSection 
                metaData={formData.metaData}
                onSetFormData={setFormData}
            />

            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </EditorLayout>
    );
}
