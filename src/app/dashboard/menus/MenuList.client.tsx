"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, GripVertical, Save, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { getMenuAction, updateMenuAction } from "@/modules/page";

type MenuItem = {
    label: string;
    url: string;
    target: string;
    order: number;
};

interface MenuListClientProps {
    initialPages: any[];
    initialMenu: any;
}

export default function MenuListClient({ initialPages, initialMenu }: MenuListClientProps) {
    const [menuSlug, setMenuSlug] = useState("main");
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishedPages] = useState<any[]>(initialPages.filter((p: any) => p.isPublished));
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        index: number | null;
    }>({
        isOpen: false,
        index: null
    });

    const fetchMenuData = React.useCallback(async (slug: string) => {
        setLoading(true);
        try {
            const data = await getMenuAction(slug);
            if (data.success && data.menu) {
                const sorted = (data.menu.items || []).sort((a: any, b: any) => a.order - b.order);
                if (sorted.length === 0 && slug === "main") {
                    setItems([
                        { label: "Home", url: "/", target: "_self", order: 0 },
                        { label: "Blog", url: "/blog", target: "_self", order: 1 },
                        { label: "Shop", url: "/shop", target: "_self", order: 2 }
                    ]);
                } else {
                    setItems(sorted.map((i: any) => ({
                        label: i.label,
                        url: i.url,
                        target: i.target || "_self",
                        order: i.order
                    })));
                }
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize list
    useEffect(() => {
        if (initialMenu && initialMenu.items) {
            const sorted = [...initialMenu.items].sort((a: any, b: any) => a.order - b.order);
            Promise.resolve().then(() => {
                setItems(sorted.map((i: any) => ({
                    label: i.label,
                    url: i.url,
                    target: i.target || "_self",
                    order: i.order
                })));
            });
        } else {
            Promise.resolve().then(() => {
                setItems([
                    { label: "Home", url: "/", target: "_self", order: 0 },
                    { label: "Blog", url: "/blog", target: "_self", order: 1 },
                    { label: "Shop", url: "/shop", target: "_self", order: 2 }
                ]);
            });
        }
    }, [initialMenu]);

    const addPageItem = (pagePath: string) => {
        if (!pagePath) return;

        const page = publishedPages.find(p => p.path === pagePath);
        if (page) {
            const url = `${page.path}`;
            setItems([...items, { label: page.title || "Page", url, target: "_self", order: items.length }]);
        }
    };

    const addItem = () => {
        setItems([...items, { label: "New Link", url: "/", target: "_self", order: items.length }]);
    };

    const updateItem = (index: number, field: keyof MenuItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setConfirmModal({ isOpen: true, index });
    };

    const confirmRemove = () => {
        if (confirmModal.index !== null) {
            setItems(items.filter((_, i) => i !== confirmModal.index));
            setConfirmModal({ isOpen: false, index: null });
            toast.success("Item dilepaskan dari daftar");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const itemsToSave = items.map((item, idx) => ({ ...item, order: idx }));
            const data = await updateMenuAction(menuSlug, itemsToSave);
            if (!data.success) throw new Error(data.error || "Failed to save");
            toast.success("Menu berhasil disimpan!");
        } catch (_e) {
            toast.error("Gagal menyimpan menu");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-8">
            <PageHeader title="Menu Navigasi" subtitle="Kelola struktur menu website." icon={<Settings />} />
            <div className="p-4 bg-card rounded-2xl border border-border">
                <Skeleton className="h-10 w-full mb-4" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6">
            <PageHeader 
                title="Menu" 
                subtitle="Kelola alur navigasi dan link utama."
                icon={<Settings />}
            >
                <div className="flex flex-col md:flex-row items-end md:items-center gap-1.5 md:gap-3">
                    <span className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 hidden md:block">Pilih Menu:</span>
                    <CustomSelect
                        id="menu-type-select"
                        options={[
                            { label: "Utama", value: "main" },
                            { label: "Footer", value: "footer" }
                        ]}
                        value={menuSlug}
                        onChange={(val) => {
                            setMenuSlug(val);
                            fetchMenuData(val);
                        }}
                        className="w-[120px] md:w-[150px]"
                    />
                </div>
            </PageHeader>

            {/* Quick Add Section */}
            <div className="p-4 bg-card border border-border/50 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-inner">
                        <Plus className="text-primary" size={18} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Tambah dari Halaman</h3>
                        <p className="text-muted-foreground text-[9px] font-medium opacity-60 italic">Tambahkan halaman yang sudah ada ke menu.</p>
                    </div>
                </div>
                <CustomSelect
                    placeholder="Pilih Halaman..."
                    options={publishedPages.map(page => ({ label: page.title, value: page.path }))}
                    onChange={addPageItem}
                    value=""
                    variant="primary"
                    className="w-full md:w-64"
                />
            </div>

            <TableContainer>
                <THead>
                    <TR>
                        <TH className="w-12 text-center">No</TH>
                        <TH className="w-1/3 min-w-[180px]">Label Menu</TH>
                        <TH className="min-w-[250px]">Tautan (Link)</TH>
                        <TH align="right" className="w-24">Aksi</TH>
                    </TR>
                </THead>
                <TBody>
                    {items.map((item, idx) => (
                        <TR key={idx}>
                            <TD align="center">
                                <div className="flex justify-center text-muted-foreground/30 cursor-move group-hover:text-primary transition-all">
                                    <GripVertical size={14} />
                                </div>
                            </TD>
                            <TD>
                                <input
                                    id={`menu-label-${idx}`}
                                    name={`menu-label-${idx}`}
                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent focus:bg-background/50 focus:border-border/50 rounded-lg outline-none text-foreground text-[10px] font-bold uppercase tracking-tight transition-all placeholder:text-muted-foreground/20"
                                    value={item.label}
                                    onChange={(e) => updateItem(idx, 'label', e.target.value)}
                                    placeholder="Nama menu..."
                                    autoComplete="off"
                                />
                            </TD>
                            <TD>
                                <input
                                    id={`menu-url-${idx}`}
                                    name={`menu-url-${idx}`}
                                    className="w-full px-2 py-1.5 bg-transparent border border-transparent focus:bg-background/50 focus:border-border/50 rounded-lg outline-none text-muted-foreground font-mono text-[9px] transition-all placeholder:text-muted-foreground/20"
                                    value={item.url}
                                    onChange={(e) => updateItem(idx, 'url', e.target.value)}
                                    placeholder="/"
                                    autoComplete="off"
                                />
                            </TD>
                            <TD align="right">
                                <button
                                    onClick={() => removeItem(idx)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </TD>
                        </TR>
                    ))}

                    {items.length === 0 && (
                        <TR>
                            <TD colSpan={4} className="py-12">
                                <div className="text-center flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted/5 flex items-center justify-center text-muted-foreground/20 border border-dashed border-border/50">
                                        <Settings size={18} />
                                    </div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Menu masih kosong.</p>
                                </div>
                            </TD>
                        </TR>
                    )}
                </TBody>
            </TableContainer>

            <div className="p-4 bg-card rounded-xl border border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                    onClick={addItem}
                    className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all active:scale-95 group"
                >
                    <div className="w-7 h-7 rounded-lg bg-muted/20 flex items-center justify-center mr-2.5 group-hover:bg-primary/10 transition-colors">
                        <Plus size={12} />
                    </div>
                    Add Link Manual
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground rounded text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" size={12} /> : <Save className="mr-2" size={12} />}
                    {saving ? "Menyimpan..." : "Simpan Menu"}
                </button>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, index: null })}
                onConfirm={confirmRemove}
                title="Hapus Link?"
                message="Link ini akan dihapus dari navigasi. Anda harus menyimpan perubahan untuk memperbarui website."
                variant="danger"
                confirmText="Hapus Link"
            />
        </div>
    );
}
