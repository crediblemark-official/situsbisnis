"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { FormSection, FormInput, FormTextArea } from "@/components/ui/Form";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { Button } from "@/components/ui/Button";

export default function GalleryForm() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [newAsset, setNewAsset] = useState({
        title: "",
        url: "",
        description: ""
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await fetch("/api/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newAsset),
            });

            if (res.ok) {
                toast.success("Aset berhasil ditambahkan");
                setIsCreating(false);
                setNewAsset({ title: "", url: "", description: "" });
                router.refresh();
            } else {
                toast.error("Gagal menambahkan aset");
            }
        } catch (_e) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setLoading(false);
        }
    };

    if (!isCreating) {
        return (
            <div className="flex justify-end mb-4">
                <Button 
                    onClick={() => setIsCreating(true)}
                    icon={<Plus size={14} />}
                    size="sm"
                    className="uppercase tracking-widest font-black"
                >
                    Tambah Baru
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-in slide-in-from-top-2 duration-500 mb-6">
            <FormSection
                title="Tambah Aset Baru"
                description="Unggah dan simpan gambar baru ke dalam galeri."
            >
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput 
                            label="Judul" 
                            name="title" 
                            required 
                            placeholder="Judul gambar..." 
                            value={newAsset.title}
                            onChange={(e) => setNewAsset({...newAsset, title: e.target.value})}
                        />
                        <FormMediaPicker 
                            label="File Gambar" 
                            value={newAsset.url} 
                            onChange={(val) => setNewAsset({...newAsset, url: val})} 
                        />
                    </div>
                    <FormTextArea 
                        label="Deskripsi" 
                        name="description" 
                        placeholder="Keterangan singkat..." 
                        rows={2} 
                        value={newAsset.description}
                        onChange={(e) => setNewAsset({...newAsset, description: e.target.value})}
                    />
                    <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                        <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Batal</Button>
                        <Button type="submit" loading={loading}>Simpan</Button>
                    </div>
                </form>
            </FormSection>
        </div>
    );
}
