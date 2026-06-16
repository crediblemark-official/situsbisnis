
"use client";

import React, { useState, useEffect } from "react";
import { 
    Upload, Image as ImageIcon, Loader2, 
    Folder, FolderPlus
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

type MediaItem = {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    createdAt: string;
    folderId?: string | null;
};

type MediaFolder = {
    id: string;
    name: string;
    parentId?: string | null;
    _count?: {
        items: number;
        children: number;
    };
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

import { MediaItemCard } from "@/components/dashboard/media/MediaItemCard";
import { MediaFolderCard } from "@/components/dashboard/media/MediaFolderCard";
import { MediaQuota } from "@/components/dashboard/media/MediaQuota";
import { MediaBreadcrumbs } from "@/components/dashboard/media/MediaBreadcrumbs";

export default function MediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [folders, setFolders] = useState<MediaFolder[]>([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [currentFolderId, setCurrentFolderId] = useState<string>("root");
    const [path, setPath] = useState<MediaFolder[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [showItemDeleteModal, setShowItemDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
    const [showFolderDeleteModal, setShowFolderDeleteModal] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState<MediaFolder | null>(null);

    const [quota, setQuota] = useState<{ used: number; max: number } | null>(null);

    const [prevFolderId, setPrevFolderId] = useState(currentFolderId);
    if (currentFolderId !== prevFolderId) {
        setPrevFolderId(currentFolderId);
        if (currentFolderId !== "root") setLoading(true);
    }

    const fetchContent = React.useCallback(async (page: number = 1) => {
        try {
            const folderParam = currentFolderId === "root" ? "root" : currentFolderId;
            const foldersRes = await fetch(`/api/media/folders?parentId=${currentFolderId === "root" ? "" : currentFolderId}`);
            const foldersData = await foldersRes.json();
            setFolders(foldersData);

            const itemsRes = await fetch(`/api/media?folderId=${folderParam}&page=${page}&limit=30`);
            const itemsResData = await itemsRes.json();
            setItems(itemsResData.data || []);
            setPagination(itemsResData.pagination || { page: 1, totalPages: 1 });

            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch media content", error);
            setLoading(false);
        }
    }, [currentFolderId]);

    useEffect(() => {
        let ignore = false;
        async function fetchInitialContent() {
            try {
                const folderParam = currentFolderId === "root" ? "root" : currentFolderId;
                const foldersRes = await fetch(`/api/media/folders?parentId=${currentFolderId === "root" ? "" : currentFolderId}`);
                const foldersData = await foldersRes.json();
                const itemsRes = await fetch(`/api/media?folderId=${folderParam}&page=1&limit=30`);
                const itemsResData = await itemsRes.json();
                
                if (!ignore) {
                    setFolders(foldersData);
                    setItems(itemsResData.data || []);
                    setPagination(itemsResData.pagination || { page: 1, totalPages: 1 });
                    setQuota(itemsResData.quota || null);
                    setLoading(false);
                }
            } catch (error) {
                if (!ignore) {
                    console.error("Failed to fetch media content", error);
                    setLoading(false);
                }
            }
        }
        fetchInitialContent();
        return () => { ignore = true; };
    }, [currentFolderId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        if (file.size > MAX_FILE_SIZE) {
            toast.error("File terlalu besar. Maksimal 5MB.");
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        if (currentFolderId !== "root") {
            formData.append("folderId", currentFolderId);
        }
        try {
            const res = await fetch("/api/media", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const error = await res.text();
                throw new Error(error || "Gagal mengunggah");
            }
            fetchContent();
            toast.success("Berhasil diunggah");
        } catch (error: any) {
            toast.error(error.message || "Gagal mengunggah");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            const res = await fetch("/api/media/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName,
                    parentId: currentFolderId === "root" ? null : currentFolderId
                }),
            });
            if (res.ok) {
                setNewFolderName("");
                setIsCreatingFolder(false);
                fetchContent();
                toast.success("Folder berhasil dibuat");
            }
        } catch (_) {
            toast.error("Gagal membuat folder");
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        setDeletingId(itemToDelete.id);
        try {
            await fetch(`/api/media/${itemToDelete.id}`, { method: "DELETE" });
            fetchContent();
            toast.success("Gambar berhasil dihapus");
        } catch (_) {
            toast.error("Gagal menghapus gambar");
        } finally {
            setDeletingId(null);
            setShowItemDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const handleDeleteFolder = async () => {
        if (!folderToDelete) return;
        try {
            const res = await fetch(`/api/media/folders/${folderToDelete.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            fetchContent();
            toast.success("Folder berhasil dihapus");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setShowFolderDeleteModal(false);
            setFolderToDelete(null);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success("URL Disalin!");
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20">
            <PageHeader 
                title="Media" 
                subtitle="Kelola semua gambar dan file aset Anda."
                icon={<ImageIcon />}
            >
                <div className="flex flex-col md:flex-row items-end md:items-center gap-6">
                    <MediaQuota quota={quota} />
                    <div className="flex items-center gap-1.5 md:gap-3">
                        <button 
                            onClick={() => setIsCreatingFolder(true)}
                            className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 bg-muted/10 border border-border text-foreground rounded-md hover:bg-muted/20 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                        >
                            <FolderPlus size={14} /> 
                            <span className="hidden sm:inline">Folder Baru</span>
                            <span className="sm:hidden">Folder</span>
                        </button>
                        <label 
                            htmlFor="media-upload"
                            className={`
                            inline-flex items-center justify-center gap-1.5 px-3 md:px-4 py-1.5 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-95
                            ${uploading || (quota && quota.max !== -1 && quota.used >= quota.max) ? "opacity-50 cursor-not-allowed" : ""}
                        `}>
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                            <span className="hidden sm:inline">
                                {uploading ? "Mengunggah..." : (quota && quota.max !== -1 && quota.used >= quota.max) ? "Kuota Penuh" : "Unggah Media"}
                            </span>
                            <span className="sm:hidden">
                                {uploading ? "..." : (quota && quota.max !== -1 && quota.used >= quota.max) ? "Penuh" : "Unggah"}
                            </span>
                            <input
                                id="media-upload"
                                name="file"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleUpload}
                                disabled={uploading || (quota && quota.max !== -1 && quota.used >= quota.max)}
                            />
                        </label>
                    </div>
                </div>
            </PageHeader>

            <MediaBreadcrumbs 
                path={path}
                currentFolderId={currentFolderId}
                onNavigateRoot={() => { setPath([]); setCurrentFolderId("root"); }}
                onNavigateFolder={(p, i) => {
                    const newPath = path.slice(0, i + 1);
                    setPath(newPath);
                    setCurrentFolderId(p.id);
                }}
            />

            {isCreatingFolder && (
                <form onSubmit={handleCreateFolder} className="mb-6 p-2.5 bg-card border border-primary/20 rounded-md flex gap-3 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
                    <input 
                        id="new-folder-name"
                        name="folderName"
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nama Folder Baru"
                        className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs text-foreground outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold"
                    />
                    <button type="submit" className="px-[5px] py-1.5 bg-primary text-primary-foreground rounded-md text-[10px] font-black uppercase tracking-widest">Buat</button>
                    <button type="button" onClick={() => setIsCreatingFolder(false)} className="px-[5px] py-1.5 bg-muted/10 text-foreground border border-border rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-muted/20">Batal</button>
                </form>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            ) : (folders.length === 0 && items.length === 0) ? (
                <EmptyState 
                    icon={currentFolderId === "root" ? <ImageIcon size={32} /> : <Folder size={32} />} 
                    message={currentFolderId === "root" ? "Belum ada aset media." : "Folder ini kosong."} 
                    className="py-24"
                />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {folders.map((folder) => (
                        <MediaFolderCard 
                            key={folder.id}
                            folder={folder}
                            onNavigate={(f) => {
                                setPath([...path, f]);
                                setCurrentFolderId(f.id);
                            }}
                            onDelete={(f) => {
                                setFolderToDelete(f);
                                setShowFolderDeleteModal(true);
                            }}
                        />
                    ))}

                    {items.map((item) => (
                        <MediaItemCard 
                            key={item.id}
                            item={item}
                            onCopy={copyToClipboard}
                            onDelete={(i) => {
                                setItemToDelete(i);
                                setShowItemDeleteModal(true);
                            }}
                            isDeleting={deletingId === item.id}
                        />
                    ))}
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div className="mt-16 flex justify-center items-center gap-6">
                    <button 
                        disabled={pagination.page <= 1}
                        onClick={() => fetchContent(pagination.page - 1)}
                        className="px-6 py-2 bg-muted/10 border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-muted/20 disabled:opacity-30 transition-all"
                    >
                        Kembali
                    </button>
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                        Halaman {pagination.page} <span className="opacity-30">/</span> {pagination.totalPages}
                    </span>
                    <button 
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => fetchContent(pagination.page + 1)}
                        className="px-6 py-2 bg-muted/10 border border-border rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-muted/20 disabled:opacity-30 transition-all"
                    >
                        Lanjut
                    </button>
                </div>
            )}

            <ConfirmationModal
                isOpen={showItemDeleteModal}
                onClose={() => setShowItemDeleteModal(false)}
                onConfirm={handleDeleteItem}
                title="Hapus Media?"
                message={`Apakah Anda yakin ingin menghapus "${itemToDelete?.filename}"? File akan dihapus permanen dari storage.`}
                confirmText="Ya, Hapus"
                variant="danger"
            />

            <ConfirmationModal
                isOpen={showFolderDeleteModal}
                onClose={() => setShowFolderDeleteModal(false)}
                onConfirm={handleDeleteFolder}
                title="Hapus Folder?"
                message={`Hapus folder "${folderToDelete?.name}"? Pastikan folder sudah kosong sebelum dihapus.`}
                confirmText="Ya, Hapus"
                variant="danger"
            />
        </div>
    );
}
