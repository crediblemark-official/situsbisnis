"use client";

import React from "react";
import { FormInput, FormSwitch } from "@/components/ui/Form";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { SeoScoreIndicator, SeoCheck } from "@/components/dashboard/SeoScoreIndicator";

interface PageSidebarProps {
    formData: any;
    isEditing: boolean;
    onChange: (_e: React.ChangeEvent<any>) => void;
    onSetFormData: (_data: any) => void;
}

export function PageSidebar({ formData, isEditing, onChange, onSetFormData }: PageSidebarProps) {
    const title = formData.title || "";
    const description = formData.description || "";
    const path = formData.path || "";
    const imageUrl = formData.imageUrl || "";

    // Extract keywords and noindex from metadata
    const keywordsMeta = formData.metaData?.find((m: any) => m.key === "keywords");
    const keywordsValue = keywordsMeta?.value || "";

    const noIndexMeta = formData.metaData?.find((m: any) => m.key === "noindex");
    const noIndexValue = noIndexMeta?.value === "true";

    const hideHeaderMeta = formData.metaData?.find((m: any) => m.key === "hide_header");
    const hideHeaderValue = hideHeaderMeta?.value === "true";

    const hideFooterMeta = formData.metaData?.find((m: any) => m.key === "hide_footer");
    const hideFooterValue = hideFooterMeta?.value === "true";

    const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newMetaData = [...(formData.metaData || [])];
        const index = newMetaData.findIndex((m: any) => m.key === "keywords");
        
        if (index > -1) {
            newMetaData[index] = { ...newMetaData[index], value: val };
        } else {
            newMetaData.push({ key: "keywords", value: val, type: "text" });
        }
        
        onSetFormData((prev: any) => ({
            ...prev,
            metaData: newMetaData
        }));
    };

    const handleNoIndexChange = (checked: boolean) => {
        const newMetaData = [...(formData.metaData || [])];
        const index = newMetaData.findIndex((m: any) => m.key === "noindex");
        
        if (index > -1) {
            newMetaData[index] = { ...newMetaData[index], value: checked ? "true" : "false" };
        } else {
            newMetaData.push({ key: "noindex", value: checked ? "true" : "false", type: "text" });
        }
        
        onSetFormData((prev: any) => ({
            ...prev,
            metaData: newMetaData
        }));
    };

    const handleHideHeaderChange = (checked: boolean) => {
        const newMetaData = [...(formData.metaData || [])];
        const index = newMetaData.findIndex((m: any) => m.key === "hide_header");
        
        if (index > -1) {
            newMetaData[index] = { ...newMetaData[index], value: checked ? "true" : "false" };
        } else {
            newMetaData.push({ key: "hide_header", value: checked ? "true" : "false", type: "text" });
        }
        
        onSetFormData((prev: any) => ({
            ...prev,
            metaData: newMetaData
        }));
    };

    const handleHideFooterChange = (checked: boolean) => {
        const newMetaData = [...(formData.metaData || [])];
        const index = newMetaData.findIndex((m: any) => m.key === "hide_footer");
        
        if (index > -1) {
            newMetaData[index] = { ...newMetaData[index], value: checked ? "true" : "false" };
        } else {
            newMetaData.push({ key: "hide_footer", value: checked ? "true" : "false", type: "text" });
        }
        
        onSetFormData((prev: any) => ({
            ...prev,
            metaData: newMetaData
        }));
    };

    const checks: SeoCheck[] = [
        {
            id: "title_exists",
            label: "Judul Halaman Terisi",
            isValid: title.trim().length >= 5,
            points: 15,
            tip: "Judul minimal 5 karakter agar dikenali oleh mesin pencari."
        },
        {
            id: "title_length",
            label: "Panjang Judul Optimal (10-60 karakter)",
            isValid: title.trim().length >= 10 && title.trim().length <= 60,
            points: 10,
            tip: "Panjang judul ideal adalah 10-60 karakter agar tidak terpotong di Google."
        },
        {
            id: "desc_exists",
            label: "Deskripsi SEO Terisi",
            isValid: description.trim().length >= 20,
            points: 15,
            tip: "Berikan deskripsi singkat minimal 20 karakter yang merangkum isi halaman."
        },
        {
            id: "desc_length",
            label: "Panjang Deskripsi Optimal (50-160 karakter)",
            isValid: description.trim().length >= 50 && description.trim().length <= 160,
            points: 10,
            tip: "Deskripsi 50-160 karakter berkinerja paling baik di halaman pencarian."
        },
        {
            id: "slug_friendly",
            label: "URL Slug Ramah SEO",
            isValid: path === "/" || (path.length > 0 && path.startsWith("/") && /^\/[a-z0-9\-\/]+$/.test(path)),
            points: 15,
            tip: "Gunakan huruf kecil, angka, dan tanda hubung (-) tanpa spasi atau karakter khusus."
        },
        {
            id: "keywords_exists",
            label: "Kata Kunci SEO Terisi",
            isValid: keywordsValue.trim().length > 0,
            points: 10,
            tip: "Tulis kata kunci SEO agar halaman Anda relevan dengan topik pencarian."
        },
        {
            id: "keywords_count",
            label: "Minimal 3 Kata Kunci SEO",
            isValid: keywordsValue.split(',').filter((k: string) => k.trim().length > 0).length >= 3,
            points: 10,
            tip: "Gunakan minimal 3 kata kunci SEO yang dipisahkan oleh tanda koma."
        },
        {
            id: "og_image",
            label: "Gambar Media Sosial Disematkan",
            isValid: !!imageUrl,
            points: 15,
            tip: "Gambar OG membantu meningkatkan tingkat klik (CTR) saat dibagikan."
        }
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Pengaturan Halaman</h4>
                
                <FormInput 
                    label="Alamat URL (Slug)" 
                    name="path" 
                    required 
                    value={formData.path}
                    onChange={onChange}
                    placeholder="/path" 
                    disabled={isEditing && formData.path === "/"}
                    tooltip="Gunakan '/' untuk Halaman Utama (Beranda). Gunakan format '/nama-halaman' (misal: /tentang-kami) untuk halaman lainnya."
                    tooltipPlacement="bottom"
                />

                <div className="space-y-1">
                    <label htmlFor="page-seo-desc" className="text-[10px] font-semibold text-muted-foreground ml-1">Deskripsi SEO</label>
                    <textarea
                        id="page-seo-desc"
                        name="description"
                        value={formData.description || ""}
                        onChange={onChange}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-muted/5 border border-border/50 rounded-lg text-xs text-foreground outline-none focus:border-primary/50 transition-colors resize-y overflow-hidden shadow-inner"
                        placeholder="Tulis deskripsi singkat..."
                    />
                </div>

                <FormInput 
                    label="Kata Kunci SEO (Keywords)" 
                    name="keywords" 
                    value={keywordsValue}
                    onChange={handleKeywordsChange}
                    placeholder="Contoh: seo, profil, bisnis (pisahkan dengan koma)" 
                />

                {/* Indikator Skor SEO Reusable */}
                <SeoScoreIndicator checks={checks} />

                <div className="pt-3 border-t border-border/50 space-y-1">
                    <FormMediaPicker 
                        label="Gambar Media Sosial" 
                        value={formData.imageUrl || ""}
                        onChange={(val) => onSetFormData((prev: any) => ({ ...prev, imageUrl: val }))}
                    />
                </div>
            </div>

            <div className="pt-3 border-t border-border/50 space-y-4">
                <FormSwitch
                    label="Tampilkan Halaman"
                    description="Tersedia untuk publik"
                    checked={formData.isPublished}
                    onChange={(checked) => onSetFormData((prev: any) => ({ ...prev, isPublished: checked }))}
                />

                <FormSwitch
                    label="Izinkan Indeks Google"
                    description="Izinkan mesin pencari menampilkan halaman ini (Index/Noindex)"
                    checked={!noIndexValue}
                    onChange={(checked) => handleNoIndexChange(!checked)}
                />

                {formData.useBuilder && (
                    <>
                        <FormSwitch
                            label="Sembunyikan Header Bawaan"
                            description="Matikan header tema agar bisa membuat header kustom sendiri"
                            checked={hideHeaderValue}
                            onChange={handleHideHeaderChange}
                        />

                        <FormSwitch
                            label="Sembunyikan Footer Bawaan"
                            description="Matikan footer tema agar bisa membuat footer kustom sendiri"
                            checked={hideFooterValue}
                            onChange={handleHideFooterChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
