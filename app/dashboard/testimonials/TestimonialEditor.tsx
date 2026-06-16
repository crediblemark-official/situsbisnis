
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { FormSection, FormInput, FormTextArea, FormSwitch } from "@/components/ui/Form";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EditorLayout } from "@/components/dashboard/EditorLayout";

interface TestimonialData {
    id?: string;
    quote: string;
    author: string;
    role?: string;
    rating: number;
    isApproved?: boolean;
    avatarUrl?: string;
}

export default function TestimonialEditor({ initialData }: { initialData?: TestimonialData }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: initialData?.id || "",
        author: initialData?.author || "",
        role: initialData?.role || "",
        quote: initialData?.quote || "",
        rating: initialData?.rating || 5,
        isApproved: initialData?.isApproved ?? true,
        avatarUrl: initialData?.avatarUrl || ""
    });

    const isEditMode = !!initialData?.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const method = isEditMode ? "PUT" : "POST";
            const res = await fetch("/api/testimonials", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push("/dashboard/testimonials");
                router.refresh();
                toast.success("Testimoni berhasil disimpan");
            } else {
                toast.error("Gagal menyimpan testimoni");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat menyimpan");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/testimonials/${formData.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/dashboard/testimonials");
                router.refresh();
                toast.success("Testimoni berhasil dihapus");
            } else {
                toast.error("Gagal menghapus testimoni");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat menghapus");
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    return (
        <EditorLayout
            title={isEditMode ? `Testimoni: ${formData.author}` : "Tambah Testi"}
            description={isEditMode ? `ID: ${formData.id}` : "Tambahkan ulasan pelanggan baru"}
            backUrl="/dashboard/testimonials"
            isSaving={loading}
            onSubmit={handleSubmit}
            isSidebarOpen={isSidebarOpen}
            onSidebarOpenChange={setIsSidebarOpen}
            sidebarContent={
                <div className="space-y-4">
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Pengaturan Testimoni</h4>

                        <div className="pt-1">
                            <FormSwitch
                                label="Tampilkan"
                                description="Tersedia untuk publik"
                                checked={formData.isApproved}
                                onChange={(checked) => setFormData(prev => ({ ...prev, isApproved: checked }))}
                            />
                        </div>

                        <div className="pt-3 border-t border-border/50">
                            <FormMediaPicker
                                label="Foto Profil"
                                value={formData.avatarUrl || ""}
                                onChange={(val) => setFormData(prev => ({ ...prev, avatarUrl: val }))}
                                variant="compact"
                            />
                        </div>
                    </div>

                    {isEditMode && (
                        <div className="pt-3 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full py-2 bg-red-500/5 border border-red-500/10 text-red-500 rounded-lg text-[9px] font-semibold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 opacity-60 hover:opacity-100"
                            >
                                <Trash2 size={11} /> Hapus Testimoni
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <FormSection
                title="Identitas Penulis"
                description="Data lengkap orang yang memberikan testimoni."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                        label="Nama Lengkap"
                        name="author"
                        required
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        placeholder="Contoh: Budi Santoso"
                    />
                    <FormInput
                        label="Jabatan / Peran"
                        name="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Contoh: CEO di Toko Kue"
                    />
                </div>
            </FormSection>

            <FormSection
                title="Konten Testimoni"
                description="Isi ulasan atau kutipan yang akan ditampilkan ke publik."
            >
                <div className="space-y-6">
                    <FormTextArea
                        label="Kutipan (Quote)"
                        name="quote"
                        required
                        value={formData.quote}
                        onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                        placeholder="Tuliskan ulasan pelanggan di sini..."
                        rows={8}
                    />
                </div>
            </FormSection>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Testimoni?"
                message="Apakah Anda yakin ingin menghapus testimoni ini secara permanen?"
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />
        </EditorLayout>
    );
}


