"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FormRichText } from "@/components/ui/FormRichText";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { slugify } from "@/lib/utils/string";
import { EditorLayout } from "@/components/dashboard/EditorLayout";
import { FormSection, FormInput, FormSelect, FormSwitch } from "@/components/ui/Form";
import { SeoScoreIndicator, SeoCheck } from "@/components/dashboard/SeoScoreIndicator";

export default function PostEditor({ postId, initialData, initialCategories }: { postId?: string, initialData?: any, initialCategories?: string[] }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>(initialCategories || []);
    const [loadingCategories, setLoadingCategories] = useState(!initialCategories);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        imageUrl: initialData?.imageUrl || "",
        content: initialData?.content ? (typeof initialData.content === 'string' ? initialData.content : JSON.stringify(initialData.content)) : "",
        status: initialData?.published ? "published" : "draft",
        excerpt: initialData?.excerpt || "",
        metaData: initialData?.metaData || []
    });

    const isEditing = !!postId || !!initialData?.id;

    // Load categories dynamically from Site Taxonomies where slug = "category"
    React.useEffect(() => {
        if (initialCategories) return;
        const loadCategories = async () => {
            try {
                const res = await fetch("/api/taxonomies");
                if (!res.ok) throw new Error("Gagal mengambil taksonomi");
                const taxRes = await res.json();
                const taxonomies = taxRes.data || taxRes;
                
                if (Array.isArray(taxonomies)) {
                    let categoryTax = taxonomies.find(
                        (t: any) => t.slug === "category" || t.name?.toLowerCase() === "category" || t.name?.toLowerCase() === "kategori"
                    );
                    
                    if (!categoryTax && taxonomies.length > 0) {
                        categoryTax = taxonomies[0];
                    }
                    
                    if (categoryTax) {
                        const termsRes = await fetch(`/api/taxonomies/${categoryTax.id}/terms`);
                        if (termsRes.ok) {
                            const termsData = await termsRes.json();
                            const terms = termsData.data || termsData;
                            if (Array.isArray(terms)) {
                                const names = terms.map((term: any) => term.name);
                                setCategories(names);
                                setLoadingCategories(false);
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error loading dynamic categories in PostEditor:", err);
            }
            
            // Empty array if no taxonomy or terms found. NO hardcoded fallbacks!
            setCategories([]);
            setLoadingCategories(false);
        };
        
        loadCategories();
    }, [initialCategories]);

    // Extract keywords and noindex from metadata
    const keywordsMeta = formData.metaData?.find((m: any) => m.key === "keywords");
    const keywordsValue = keywordsMeta?.value || "";

    const noIndexMeta = formData.metaData?.find((m: any) => m.key === "noindex");
    const noIndexValue = noIndexMeta?.value === "true";

    const categoryMeta = formData.metaData?.find((m: any) => m.key === "category");
    const categoryValue = categoryMeta?.value || "";

    const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newMetaData = [...(formData.metaData || [])];
        const index = newMetaData.findIndex((m: any) => m.key === "keywords");
        
        if (index > -1) {
            newMetaData[index] = { ...newMetaData[index], value: val };
        } else {
            newMetaData.push({ key: "keywords", value: val, type: "text" });
        }
        
        setFormData(prev => ({
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
        
        setFormData(prev => ({
            ...prev,
            metaData: newMetaData
        }));
    };

    const handleCategoryChange = (e: any) => {
        const val = e.target.value;
        const newMetaData = [...(formData.metaData || [])];
        const index = newMetaData.findIndex((m: any) => m.key === "category");
        
        if (index > -1) {
            newMetaData[index] = { ...newMetaData[index], value: val };
        } else {
            newMetaData.push({ key: "category", value: val, type: "text" });
        }
        
        setFormData(prev => ({
            ...prev,
            metaData: newMetaData
        }));
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        const currentAutoSlug = slugify(formData.title);

        setFormData(prev => {
            const newData = { ...prev, title: newTitle };
            if (!prev.slug || prev.slug === currentAutoSlug) {
                newData.slug = slugify(newTitle);
            }
            return newData;
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            let parsedContent = formData.content;
            try {
                parsedContent = JSON.parse(formData.content);
            } catch {
                // keep as is
            }

            let res;
            if (isEditing) {
                const { updatePostAction } = await import("@/modules/post/actions/post.actions");
                res = await updatePostAction(initialData.id, {
                    ...formData,
                    content: parsedContent,
                    status: formData.status
                });
            } else {
                const { createPostAction } = await import("@/modules/post/actions/post.actions");
                res = await createPostAction({
                    ...formData,
                    content: parsedContent,
                    status: formData.status
                });
            }

            if (!res.success) throw new Error(res.error || "Failed to save");

            router.refresh();
            router.push("/dashboard/posts");
            toast.success("Artikel berhasil disimpan");
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan artikel");
        } finally {
            setIsLoading(false);
        }
    }

    // Dynamic SEO Scoring for Blog Posts
    const getContentLength = (textOrJson: string) => {
        if (!textOrJson) return 0;
        try {
            const parsed = JSON.parse(textOrJson);
            const getTextLen = (node: any): number => {
                if (!node) return 0;
                if (node.type === 'text' && typeof node.text === 'string') {
                    return node.text.length;
                }
                if (Array.isArray(node.content)) {
                    return node.content.reduce((acc: number, child: any) => acc + getTextLen(child), 0);
                }
                return 0;
            };
            return getTextLen(parsed);
        } catch {
            return textOrJson.replace(/<[^>]*>/g, '').length;
        }
    };

    const getPlainTextExcerpt = () => {
        if (!formData.content) return "";
        let text = "";
        try {
            const parsed = JSON.parse(formData.content);
            const extractText = (node: any): string => {
                if (!node) return "";
                if (node.type === 'text' && typeof node.text === 'string') {
                    return node.text;
                }
                if (Array.isArray(node.content)) {
                    return node.content.map((child: any) => extractText(child)).join(" ");
                }
                return "";
            };
            text = extractText(parsed);
        } catch {
            text = formData.content.replace(/<[^>]*>/g, ' ');
        }
        text = text.replace(/\s+/g, ' ').trim();
        if (text.length <= 150) return text;
        return text.substring(0, 147) + "...";
    };

    const title = formData.title || "";
    const slug = formData.slug || "";
    const imageUrl = formData.imageUrl || "";
    const contentLen = getContentLength(formData.content);
    const excerpt = formData.excerpt || "";
    const autoExcerpt = getPlainTextExcerpt();

    const checks: SeoCheck[] = [
        {
            id: "title_exists",
            label: "Judul Halaman Terisi",
            isValid: title.trim().length >= 5,
            points: 10,
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
            id: "content_exists",
            label: "Konten Artikel Terisi",
            isValid: contentLen >= 100,
            points: 10,
            tip: "Tulis konten artikel minimal 100 karakter agar informatif bagi pembaca."
        },
        {
            id: "content_length",
            label: "Panjang Artikel SEO Sehat (min. 300 kata/karakter)",
            isValid: contentLen >= 300,
            points: 10,
            tip: "Panjang konten minimal 300 karakter disukai oleh algoritma Google."
        },
        {
            id: "slug_friendly",
            label: "URL Slug Ramah SEO",
            isValid: slug.length > 0 && /^[a-z0-9\-]+$/.test(slug),
            points: 10,
            tip: "Gunakan huruf kecil, angka, dan tanda hubung (-) tanpa spasi atau karakter khusus."
        },
        {
            id: "excerpt_exists",
            label: "Deskripsi SEO Terisi (Kustom/Otomatis)",
            isValid: excerpt.trim().length > 0 || autoExcerpt.trim().length > 0,
            points: 10,
            tip: "Tulis deskripsi kustom atau biarkan sistem membuat deskripsi otomatis dari kalimat artikel Anda."
        },
        {
            id: "excerpt_length",
            label: "Panjang Deskripsi Cukup Baik (min. 50 karakter)",
            isValid: (excerpt ? excerpt.trim().length : autoExcerpt.trim().length) >= 50,
            points: 10,
            tip: "Deskripsi ideal memiliki panjang minimal 50 karakter agar informatif di Google SERP."
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
            id: "featured_image",
            label: "Gambar Sampul Disematkan",
            isValid: !!imageUrl,
            points: 10,
            tip: "Gambar sampul yang menarik meningkatkan tingkat klik (CTR) saat dibagikan."
        }
    ];

    const sidebarContent = (
        <div className="space-y-4">
            <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Pengaturan Artikel</h4>

                <FormInput
                    label="Alamat URL (Slug)"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="/slug"
                />

                <FormSelect
                    label="Status Publikasi"
                    value={formData.status}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    options={[
                        { label: "Simpan sebagai Draft", value: "draft" },
                        { label: "Terbitkan Sekarang", value: "published" }
                    ]}
                />

                <FormSelect
                    label="Kategori Artikel"
                    value={categoryValue}
                    onChange={handleCategoryChange}
                    disabled={loadingCategories}
                    options={[
                        { label: "-- Pilih Kategori --", value: "" },
                        ...categories.map(cat => ({ label: cat, value: cat }))
                    ]}
                />

                <div className="space-y-1">
                    <label htmlFor="post-seo-desc" className="text-[10px] font-semibold text-muted-foreground ml-1">Deskripsi SEO (Kustom)</label>
                    <textarea
                        id="post-seo-desc"
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-1.5 bg-muted/5 border border-border/50 rounded-lg text-xs text-foreground outline-none focus:border-primary/50 transition-colors resize-y overflow-hidden shadow-inner"
                        placeholder="Kosongkan untuk otomatis menggunakan ringkasan kalimat pertama artikel..."
                    />
                </div>

                {(!formData.excerpt || formData.excerpt.trim().length === 0) && autoExcerpt.trim().length > 0 && (
                    <div className="px-2.5 py-1.5 bg-primary/5 border border-primary/10 rounded-lg space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[8px] font-bold text-primary uppercase tracking-wider">Deskripsi SEO Otomatis (Preview)</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-normal italic">
                            &ldquo;{autoExcerpt}&rdquo;
                        </p>
                    </div>
                )}

                <FormInput
                    label="Kata Kunci SEO (Keywords)"
                    name="keywords"
                    value={keywordsValue}
                    onChange={handleKeywordsChange}
                    placeholder="Contoh: seo, resep, kuliner (pisahkan dengan koma)"
                />
            </div>

            {/* Indikator Skor SEO Reusable */}
            <SeoScoreIndicator checks={checks} />

            <div className="pt-3 border-t border-border/50 space-y-1">
                <FormMediaPicker
                    label="Gambar Sampul"
                    value={formData.imageUrl}
                    onChange={(val) => setFormData(prev => ({ ...prev, imageUrl: val }))}
                />
            </div>

            <div className="pt-3 border-t border-border/50 space-y-4">
                <FormSwitch
                    label="Izinkan Indeks Google"
                    description="Izinkan mesin pencari menampilkan artikel ini (Index/Noindex)"
                    checked={!noIndexValue}
                    onChange={(checked) => handleNoIndexChange(!checked)}
                />
            </div>

            <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="w-full lg:hidden mt-2 py-2.5 bg-foreground text-background rounded-xl text-[11px] font-semibold hover:opacity-90 transition-all active:scale-95"
            >
                Selesai
            </button>

        </div>
    );
    return (
        <EditorLayout
            title={isEditing ? formData.title || "Edit Artikel" : "Buat Artikel"}
            description={isEditing ? "Mengedit Artikel" : "Menambah Konten Baru"}
            backUrl="/dashboard/posts"
            isSaving={isLoading}
            onSubmit={handleSubmit}
            isSidebarOpen={isSidebarOpen}
            onSidebarOpenChange={setIsSidebarOpen}
            sidebarContent={sidebarContent}
        >
            <FormSection
                title="Detail Artikel"
                description="Isi judul dan konten utama artikel Anda."
            >
                <div className="space-y-6">
                    <FormInput
                        label="Judul"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="Masukkan judul artikel..."
                    />

                    <FormRichText
                        label="Editor Konten"
                        value={formData.content}
                        onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                    />
                </div>
            </FormSection>
        </EditorLayout>
    );
}
