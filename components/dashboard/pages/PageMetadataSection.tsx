"use client";

import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormSection } from "@/components/ui/Form";

interface PageMetadataSectionProps {
    metaData: any[];
    onSetFormData: (_data: any) => void;
}

export function PageMetadataSection({ metaData, onSetFormData }: PageMetadataSectionProps) {
    const handleAdd = () => {
        onSetFormData((prev: any) => ({
            ...prev,
            metaData: [...prev.metaData, { key: "", value: "", type: "text" }]
        }));
    };

    const handleRemove = (index: number) => {
        onSetFormData((prev: any) => ({
            ...prev,
            metaData: prev.metaData.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleUpdate = (index: number, field: string, val: string) => {
        onSetFormData((prev: any) => {
            const newMeta = [...prev.metaData];
            newMeta[index] = { ...newMeta[index], [field]: val };
            return { ...prev, metaData: newMeta };
        });
    };

    return (
        <FormSection 
            title="Kolom Tambahan" 
            description="Atribut tambahan untuk halaman ini."
        >
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="text-[9px] font-black bg-primary text-primary-foreground px-2.5 py-1.5 rounded hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={10} /> Tambah Kolom
                    </button>
                </div>
                <div className="space-y-3">
                    {metaData.length === 0 ? (
                        <div className="py-6 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-lg text-center">
                            <p className="text-[10px] text-gray-500 font-medium italic">Belum ada kolom tambahan.</p>
                        </div>
                    ) : (
                        metaData.map((meta, index) => (
                            <div key={index} className="flex gap-3 items-start animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex-1 space-y-1">
                                    <input
                                        value={meta.key}
                                        onChange={(e) => handleUpdate(index, "key", e.target.value)}
                                        className="w-full px-3 py-1.5 bg-muted/5 border border-border/50 rounded text-[11px] text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/20"
                                        placeholder="Nama Kolom"
                                    />
                                </div>
                                <div className="flex-[2] space-y-1">
                                    <input
                                        value={meta.value}
                                        onChange={(e) => handleUpdate(index, "value", e.target.value)}
                                        className="w-full px-3 py-1.5 bg-muted/5 border border-border/50 rounded text-[11px] text-foreground outline-none focus:border-primary/50 placeholder:text-muted-foreground/20"
                                        placeholder="Isi"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="mt-1.5 p-1 text-gray-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </FormSection>
    );
}
