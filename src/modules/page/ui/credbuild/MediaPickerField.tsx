"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ImageIcon, X, Loader2, Upload, Search, Check } from "lucide-react";
import Portal from "@/components/ui/Portal";
import toast from "react-hot-toast";
import { getProxiedUrl } from "@/lib/media/utils";
import { getMediaListAction } from "@/modules/media/public-actions";

interface MediaItem {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
}

interface MediaPickerFieldProps {
    value: string;
    onChange: (_value: string) => void;
    label?: string;
    variant?: "default" | "compact" | "logo" | "favicon" | "square";
    id?: string;
    disabled?: boolean;
}

export const MediaPickerField = ({ value, onChange, label, variant = "default", id, disabled = false }: MediaPickerFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchMedia = useCallback(() => {
        Promise.resolve().then(() => setLoading(true));
        getMediaListAction(null, 1, 100)
            .then((res: any) => {
                if (res.success) {
                    setItems(res.data || []);
                } else {
                    toast.error(res.error || "Failed to fetch media");
                }
                setLoading(false);
            })
            .catch(_error => {
                toast.error("Failed to fetch media");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
        }
    }, [isOpen, fetchMedia]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
            if (e.key === "Tab") {
                const modalEl = document.getElementById("media-library-dialog");
                if (!modalEl) return;
                const focusableElements = modalEl.querySelectorAll(
                     'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (!firstElement || !lastElement) return;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        setTimeout(() => {
            const searchInput = document.getElementById("media-search-input");
            searchInput?.focus();
        }, 50);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/media", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            
            const newItem = await res.json();
            setItems(prev => [newItem, ...prev]);
            onChange(newItem.url);
            setIsOpen(false);
            toast.success("Image uploaded and selected");
        } catch (_error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const filteredItems = items.filter(item => 
        item.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isRowLayout = variant === "logo" || variant === "favicon";

    const handleKeyDownTrigger = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
        }
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && <label className="text-[10px] font-bold text-muted-foreground">{label}</label>}
            
            {isRowLayout ? (
                <div className="flex items-center gap-4">
                    <div 
                        id={id}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        aria-label={value ? `Preview gambar ${label || ''}, ketuk untuk ubah` : `Pilih gambar ${label || ''}`}
                        aria-disabled={disabled}
                        onClick={() => !disabled && setIsOpen(true)}
                        onKeyDown={handleKeyDownTrigger}
                        className={`group relative shrink-0 overflow-hidden border border-dashed border-border rounded-xl bg-muted/10 hover:bg-muted/20 hover:border-primary/50 transition-all shadow-inner flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none
                            ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                            ${variant === "logo" ? "w-32 h-16" : "w-16 h-16"}
                        `}
                        style={{
                            backgroundImage: value ? 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)' : 'none',
                            backgroundSize: '8px 8px',
                            backgroundColor: '#f8fafc'
                        }}
                    >
                        {value ? (
                            <Image 
                                src={getProxiedUrl(value)} 
                                alt="Preview" 
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill 
                                className={`transition-transform duration-300 group-hover:scale-105 ${variant === "logo" ? "object-contain p-2" : "object-cover"}`}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground/60 group-hover:text-primary transition-colors">
                                <ImageIcon size={variant === "logo" ? 18 : 16} />
                                <span className="text-[8px] font-bold uppercase tracking-wider">Pilih</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => setIsOpen(true)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:pointer-events-none text-primary text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none"
                        >
                            {value ? "Ubah" : "Pilih Gambar"}
                        </button>
                        {value && (
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange("");
                                }}
                                className="px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50 disabled:pointer-events-none text-destructive text-[10px] font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-sm focus-visible:ring-2 focus-visible:ring-destructive/20 focus-visible:border-destructive/50 outline-none"
                            >
                                <X size={10} />
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div 
                    id={id}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={value ? `Preview gambar ${label || ''}, ketuk untuk ubah` : `Pilih gambar ${label || ''}`}
                    aria-disabled={disabled}
                    onClick={() => !disabled && setIsOpen(true)}
                    onKeyDown={handleKeyDownTrigger}
                    className={`group relative overflow-hidden transition-all border border-dashed border-border rounded-xl bg-muted/20 shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 outline-none
                        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-primary/50"}
                        ${variant === 'compact' ? 'h-16 w-full' : variant === 'square' ? 'aspect-square w-full' : 'aspect-video w-full'}
                    `}
                >
                    {value ? (
                        <>
                            <Image 
                                src={getProxiedUrl(value)} 
                                alt="Preview" 
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill 
                                className="object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white bg-black/60 px-3 py-1 rounded-full border border-white/20 shadow-lg transition-transform active:scale-90">Ubah Gambar</span>
                            </div>
                        </>
                    ) : (
                        <div className={`absolute inset-0 flex items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity ${variant === 'compact' ? 'flex-row' : 'flex-col'}`}>
                            <ImageIcon size={variant === 'compact' ? 14 : variant === 'square' ? 18 : 24} />
                            <span className="text-[9px] font-bold">{variant === 'square' ? 'Tambah' : 'Pilih Gambar'}</span>
                        </div>
                    )}
                </div>
            )}

            {isOpen && (
                <Portal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
                        
                        <div id="media-library-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="p-6 border-b border-border flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 id="dialog-title" className="text-sm font-bold text-foreground">Media Library</h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Pilih gambar untuk digunakan</p>
                                </div>
                                <button type="button" aria-label="Close media library" onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted/10 rounded-full transition-colors text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 outline-none">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className="p-4 border-b border-border/50 bg-muted/5 flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} aria-hidden="true" />
                                    <input 
                                        type="text"
                                        id="media-search-input"
                                        aria-label="Search files"
                                        placeholder="Search files..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-background border border-border/50 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                                <label className={`
                                    flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition-all font-bold text-[10px] whitespace-nowrap shadow-lg shadow-primary/10 focus-within:ring-2 focus-within:ring-primary/20
                                    ${uploading ? "opacity-50 pointer-events-none" : ""}
                                `}>
                                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                    {uploading ? "Mengunggah..." : "Unggah Baru"}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </label>
                            </div>

                            {/* Grid */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loading ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                        <Loader2 size={32} className="animate-spin text-primary" />
                                        <p className="text-[10px] font-bold">Memuat Galeri...</p>
                                    </div>
                                ) : filteredItems.length > 0 ? (
                                    <div role="listbox" aria-label="Media items grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {filteredItems.map((item) => (
                                            <div 
                                                key={item.id}
                                                tabIndex={0}
                                                role="option"
                                                aria-selected={value === item.url}
                                                onClick={() => {
                                                    onChange(item.url);
                                                    setIsOpen(false);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        onChange(item.url);
                                                        setIsOpen(false);
                                                    }
                                                }}
                                                className={`
                                                    group relative aspect-square bg-muted/5 rounded-xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary outline-none
                                                    ${value === item.url ? "border-primary shadow-xl shadow-primary/10" : "border-border/40 hover:border-primary/30"}
                                                `}
                                            >
                                                <Image 
                                                    src={getProxiedUrl(item.url)} 
                                                    alt={item.filename} 
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" fill 
                                                    className="object-cover"
                                                />
                                                <div className={`absolute inset-0 bg-primary/10 transition-opacity ${value === item.url ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                                                {value === item.url && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-300">
                                                        <Check size={14} />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                                    <p className="text-[9px] font-bold text-white truncate">{item.filename}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                        <ImageIcon size={48} className="opacity-10" />
                                        <p className="text-[10px] font-bold opacity-40">Tidak ada media</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}
        </div>
    );
};
