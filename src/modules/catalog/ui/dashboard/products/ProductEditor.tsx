"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCurrency } from "@/hooks/use-currency";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { slugify } from "@/lib/utils/string";
import { EditorLayout } from "@/components/dashboard/EditorLayout";
import { createProductAction, updateProductAction, deleteProductAction } from "@/modules/catalog/actions/product.actions";

import { ProductInfoSection } from "@/components/dashboard/products/ProductInfoSection";
import { ProductMediaSection } from "@/components/dashboard/products/ProductMediaSection";
import { ProductVariantsSection } from "@/components/dashboard/products/ProductVariantsSection";
import { ProductSidebar } from "@/components/dashboard/products/ProductSidebar";

export default function ProductEditor({ productId, initialData }: { productId?: string, initialData?: any }) {
    const router = useRouter();
    const { symbol, currency } = useCurrency();
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Initial value for specifications (metaData)
    const getInitialMetaData = () => {
        if (initialData?.metaData && initialData.metaData.length > 0) {
            const publicMeta = initialData.metaData.filter((m: any) => !m.key.startsWith("_") && m.key !== "excerpt");
            if (publicMeta.length > 0) {
                return publicMeta.map((m: any) => ({
                    key: m.key,
                    value: m.value || "",
                    type: m.type || "text"
                }));
            }
        }
        return [
            { key: "Merek", value: "", type: "text" },
            { key: "Bahan", value: "", type: "text" },
            { key: "Ukuran", value: "", type: "text" },
            { key: "Garansi", value: "", type: "text" }
        ];
    };

    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        excerpt: initialData?.metaData?.find((m: any) => m.key === "excerpt")?.value || "",
        slug: initialData?.slug || "",
        price: initialData?.price || "",
        originalPrice: initialData?.originalPrice || "",
        stock: initialData?.stock || 0,
        description: initialData?.description || "",
        images: initialData?.images || [],
        hasVariants: (initialData?.variants && initialData.variants.length > 0) || (initialData?.variantOptions && initialData.variantOptions.length > 0),
        variantOptions: (initialData?.variantOptions && initialData.variantOptions.length > 0) 
            ? initialData.variantOptions 
            : [{ name: "Warna", values: [] }],
        variantItems: initialData?.variants || [],
        metaData: getInitialMetaData(),
        isDigital: initialData?.metaData?.some((m: any) => m.key === "_isDigital" && m.value === "true") || false,
        downloadUrl: initialData?.metaData?.find((m: any) => m.key === "_downloadUrl")?.value || ""
    });

    const isEditing = !!productId || !!initialData?.id;

    // Handle name change and auto-slugification
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        const currentAutoSlug = slugify(formData.name);
        
        setFormData(prev => {
            const newData = { ...prev, name: newName };
            if (!prev.slug || prev.slug === currentAutoSlug) {
                newData.slug = slugify(newName);
            }
            return newData;
        });
    };

    // Handle price change with IDR rounding logic
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newPrice = e.target.value;
        if (currency === "IDR" && newPrice.includes(".")) {
            // Hapus titik pemisah ribuan agar tidak salah dipotong oleh parseFloat
            const cleanPrice = newPrice.replace(/\./g, "");
            const numericPrice = parseFloat(cleanPrice);
            if (!isNaN(numericPrice)) {
                newPrice = Math.round(numericPrice).toString();
            }
        }
        setFormData(prev => ({ ...prev, price: newPrice }));
    };

    const handleOriginalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newPrice = e.target.value;
        if (currency === "IDR" && newPrice.includes(".")) {
            // Hapus titik pemisah ribuan agar tidak salah dipotong oleh parseFloat
            const cleanPrice = newPrice.replace(/\./g, "");
            const numericPrice = parseFloat(cleanPrice);
            if (!isNaN(numericPrice)) {
                newPrice = Math.round(numericPrice).toString();
            }
        }
        setFormData(prev => ({ ...prev, originalPrice: newPrice }));
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    async function handleDelete() {
        if (!initialData?.id) return;
        try {
            const res = await deleteProductAction(initialData.id);
            if (!res.success) throw new Error(res.error || "Failed to delete product");
            router.refresh();
            router.push("/dashboard/products");
            toast.success("Produk berhasil dihapus");
        } catch (error) {
            console.error(error);
            toast.error("Gagal menghapus produk");
        } finally {
            setShowDeleteModal(false);
        }
    }

    // Helper to generate combinations
    const generateCombinations = (options: any[]) => {
        const activeOptions = options.filter(opt => opt.values.length > 0);
        if (activeOptions.length === 0) return [];
        let results: any[] = [{}];
        activeOptions.forEach(opt => {
            const newResults: any[] = [];
            results.forEach(res => {
                opt.values.forEach((val: string) => {
                    newResults.push({ ...res, [opt.name]: val });
                });
            });
            results = newResults;
        });
        return results.map(combo => ({
            name: Object.values(combo).join(" / "),
            price: formData.price, 
            stock: 0,
            sku: "",
            attributes: combo
        }));
    };

    const addVariantOption = () => {
        setFormData(prev => ({
            ...prev,
            variantOptions: [...prev.variantOptions, { name: "", values: [] }]
        }));
    };

    const updateVariantOption = (idx: number, name: string) => {
        setFormData(prev => {
            const newOpts = prev.variantOptions.map((opt, i) => {
                if (i === idx) {
                    return { ...opt, name };
                }
                return opt;
            });
            return { ...prev, variantOptions: newOpts };
        });
    };

    const addVariantValue = (idx: number, value: string) => {
        if (!value.trim()) return;
        const rawValues = value.split(/[;,]+/).map(v => v.trim()).filter(Boolean);
        if (rawValues.length === 0) return;

        setFormData(prev => {
            const newOpts = prev.variantOptions.map((opt, i) => {
                if (i === idx) {
                    const currentValues = [...opt.values];
                    rawValues.forEach(val => {
                        if (!currentValues.includes(val)) {
                            currentValues.push(val);
                        }
                    });
                    return {
                        ...opt,
                        values: currentValues
                    };
                }
                return opt;
            });
            return { 
                ...prev, 
                variantOptions: newOpts,
                variantItems: generateCombinations(newOpts)
            };
        });
    };

    const removeVariantValue = (optIdx: number, valIdx: number) => {
        setFormData(prev => {
            const newOpts = prev.variantOptions.map((opt, i) => {
                if (i === optIdx) {
                    return {
                        ...opt,
                        values: opt.values.filter((_, vI) => vI !== valIdx)
                    };
                }
                return opt;
            });
            return { 
                ...prev, 
                variantOptions: newOpts,
                variantItems: generateCombinations(newOpts)
            };
        });
    };

    const updateVariantItem = (idx: number, field: string, value: any) => {
        setFormData(prev => {
            const newItems = prev.variantItems.map((item, i) => {
                if (i === idx) {
                    return { ...item, [field]: value };
                }
                return item;
            });
            return { ...prev, variantItems: newItems };
        });
    };

    // Metadata / Specifications Handlers
    const addMetaData = () => {
        setFormData(prev => ({
            ...prev,
            metaData: [...prev.metaData, { key: "", value: "", type: "text" }]
        }));
    };

    const removeMetaData = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            metaData: prev.metaData.filter((_, i) => i !== idx)
        }));
    };

    const updateMetaData = (idx: number, field: string, value: string) => {
        setFormData(prev => {
            const newMeta = [...prev.metaData];
            newMeta[idx] = { ...newMeta[idx], [field]: value };
            return { ...prev, metaData: newMeta };
        });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Only submit specifications that have both non-empty keys and values
            const validMetaData = formData.metaData.filter(
                (m: any) => m.key.trim() !== "" && m.value !== undefined && m.value !== null && m.value.toString().trim() !== ""
            );

            if (formData.excerpt.trim()) {
                validMetaData.push({
                    key: "excerpt",
                    value: formData.excerpt.trim(),
                    type: "text"
                });
            }

            if (formData.isDigital) {
                validMetaData.push({
                    key: "_isDigital",
                    value: "true",
                    type: "boolean"
                });
                validMetaData.push({
                    key: "_downloadUrl",
                    value: formData.downloadUrl.trim(),
                    type: "text"
                });
            }

            const payload = {
                name: formData.name,
                slug: formData.slug,
                price: parseFloat(formData.price.toString()),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice.toString()) : null,
                stock: formData.isDigital ? 999999 : parseInt(formData.stock.toString()),
                description: formData.description,
                images: formData.images,
                variants: formData.hasVariants ? formData.variantItems : [],
                variantOptions: formData.hasVariants ? formData.variantOptions : [],
                metaData: validMetaData
            };

            const res = isEditing
                ? await updateProductAction(initialData.id, payload)
                : await createProductAction(payload);

            if (!res.success) throw new Error(res.error || "Failed to save product");
            router.refresh();
            router.push("/dashboard/products");
            toast.success("Produk berhasil disimpan");
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Gagal menyimpan produk.");
        } finally {
            setIsLoading(false);
        }
    }

    const sidebarContent = (
        <ProductSidebar 
            currency={currency}
            symbol={symbol}
            price={formData.price}
            onPriceChange={handlePriceChange}
            originalPrice={formData.originalPrice}
            onOriginalPriceChange={handleOriginalPriceChange}
            stock={formData.stock}
            onStockChange={(val) => setFormData(prev => ({ ...prev, stock: val }))}
            slug={formData.slug}
            onSlugChange={(val) => setFormData(prev => ({ ...prev, slug: val }))}
            isEditing={isEditing}
            onDelete={() => setShowDeleteModal(true)}
            metaData={formData.metaData}
            onAddMetaData={addMetaData}
            onRemoveMetaData={removeMetaData}
            onMetaDataChange={updateMetaData}
            isDigital={formData.isDigital}
        />
    );

    return (
        <EditorLayout
            title={isEditing ? formData.name || "Edit Produk" : "Buat Produk"}
            description={isEditing ? `ID: ${productId}` : "Daftarkan produk baru ke katalog"}
            backUrl="/dashboard/products"
            isSaving={isLoading}
            onSubmit={handleSubmit}
            isSidebarOpen={isSidebarOpen}
            onSidebarOpenChange={setIsSidebarOpen}
            sidebarContent={sidebarContent}
        >
            <div className="space-y-8">
                <ProductInfoSection 
                    name={formData.name}
                    excerpt={formData.excerpt}
                    description={formData.description}
                    onNameChange={handleNameChange}
                    onExcerptChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    onDescriptionChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                    isDigital={formData.isDigital}
                    onTypeChange={(val) => setFormData(prev => ({ ...prev, isDigital: val }))}
                    downloadUrl={formData.downloadUrl}
                    onDownloadUrlChange={(e) => setFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
                />

                <ProductMediaSection 
                    images={formData.images}
                    onAddImage={(url) => setFormData(prev => ({ ...prev, images: [...prev.images, url] }))}
                    onRemoveImage={removeImage}
                />

                <ProductVariantsSection 
                    hasVariants={formData.hasVariants}
                    setHasVariants={(val) => setFormData(prev => ({ ...prev, hasVariants: val }))}
                    variantOptions={formData.variantOptions}
                    variantItems={formData.variantItems}
                    addVariantOption={addVariantOption}
                    removeVariantOption={(idx) => {
                        setFormData(prev => {
                            const newOpts = prev.variantOptions.filter((_, i) => i !== idx);
                            return { 
                                ...prev, 
                                variantOptions: newOpts,
                                variantItems: generateCombinations(newOpts)
                            };
                        });
                    }}
                    updateVariantOption={updateVariantOption}
                    addVariantValue={addVariantValue}
                    removeVariantValue={removeVariantValue}
                    updateVariantItem={updateVariantItem}
                    currency={currency}
                    symbol={symbol}
                />
            </div>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Hapus Produk?"
                message="Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                cancelText="Batal"
                variant="danger"
            />
        </EditorLayout>
    );
}

