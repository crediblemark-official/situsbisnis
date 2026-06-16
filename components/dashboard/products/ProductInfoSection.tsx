"use client";
import React from "react";
import { FormSection, FormInput, FormLabel, FormTextArea } from "@/components/ui/Form";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { Package, Download } from "lucide-react";

interface ProductInfoSectionProps {
    name: string;
    excerpt: string;
    description: string;
    onNameChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
    onExcerptChange: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onDescriptionChange: (_val: string) => void;
    isDigital?: boolean;
    onTypeChange?: (_val: boolean) => void;
    downloadUrl?: string;
    onDownloadUrlChange?: (_e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProductInfoSection({
    name,
    excerpt = "",
    description,
    onNameChange,
    onExcerptChange,
    onDescriptionChange,
    isDigital = false,
    onTypeChange,
    downloadUrl = "",
    onDownloadUrlChange
}: ProductInfoSectionProps) {
    return (
        <FormSection 
            title="Informasi Dasar" 
            description="Identitas utama produk yang akan dilihat oleh pelanggan."
        >
            <div className="space-y-6">
                {/* Tipe Produk Selector */}
                {onTypeChange && (
                    <div className="space-y-2">
                        <FormLabel>Tipe Produk</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => onTypeChange(false)}
                                className={`flex items-start gap-3 p-4 rounded-md border text-left transition-all duration-200 active:scale-[0.98] ${
                                    !isDigital
                                        ? "border-primary bg-primary/[0.04] text-foreground ring-1 ring-primary/20 shadow-sm"
                                        : "border-border/50 bg-muted/5 text-muted-foreground hover:bg-muted/10 hover:border-border"
                                }`}
                            >
                                <div className={`p-2 rounded-md ${!isDigital ? "bg-primary/10 text-primary" : "bg-muted/15 text-muted-foreground"}`}>
                                    <Package size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Produk Fisik</h4>
                                    <p className="text-[10px] opacity-80 leading-relaxed font-medium">Barang fisik yang memerlukan pengiriman kurir logistik.</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => onTypeChange(true)}
                                className={`flex items-start gap-3 p-4 rounded-md border text-left transition-all duration-200 active:scale-[0.98] ${
                                    isDigital
                                        ? "border-primary bg-primary/[0.04] text-foreground ring-1 ring-primary/20 shadow-sm"
                                        : "border-border/50 bg-muted/5 text-muted-foreground hover:bg-muted/10 hover:border-border"
                                }`}
                            >
                                <div className={`p-2 rounded-md ${isDigital ? "bg-primary/10 text-primary" : "bg-muted/15 text-muted-foreground"}`}>
                                    <Download size={18} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider">Produk Digital</h4>
                                    <p className="text-[10px] opacity-80 leading-relaxed font-medium">Akses unduh instan untuk file, e-book, lisensi, dll.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Conditional Download URL Input */}
                {isDigital && onDownloadUrlChange && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <FormInput
                            label="Link Download / URL File Akses"
                            required
                            value={downloadUrl}
                            onChange={onDownloadUrlChange}
                            placeholder="Contoh: https://example.com/files/ebook-panduan.pdf atau Drive Link"
                            icon={<Download size={14} className="text-muted-foreground/60" />}
                            tooltip="Tautan ini akan diberikan kepada pelanggan secara otomatis setelah pembayaran terkonfirmasi lunas."
                        />
                    </div>
                )}

                <FormInput 
                    label="Nama Produk" 
                    required 
                    value={name}
                    onChange={onNameChange}
                    placeholder="Contoh: Kue Lapis Legit Premium" 
                />
                <FormTextArea
                    label="Ringkasan Deskripsi"
                    value={excerpt}
                    onChange={onExcerptChange}
                    placeholder="Tulis ringkasan deskripsi pendek produk di sini (maks. 2-3 kalimat). Teks ini akan muncul di atas Detail Produk pada halaman penjualan."
                    tooltip="Ringkasan singkat produk yang akan menarik perhatian pembeli dan mendukung ekspansi deskripsi lengkap secara inline."
                    rows={3}
                />
                <div className="space-y-2">
                    <label htmlFor="product-desc" className="text-[10px] font-bold text-muted-foreground ml-1">Deskripsi Produk</label>
                    <TiptapEditor 
                        id="product-desc"
                        content={description}
                        onChange={onDescriptionChange}
                    />
                </div>
            </div>
        </FormSection>
    );
}
