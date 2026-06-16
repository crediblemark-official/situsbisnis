"use client";

import React, { useState, useRef } from "react";
import { 
    Database, 
    Download, 
    Upload, 
    AlertTriangle, 
    RefreshCw, 
    Users, 
    Globe, 
    ShoppingBag, 
    DollarSign,
    ShieldAlert,
    Check
} from "lucide-react";
import { toast } from "react-hot-toast";

interface BackupClientProps {
    stats: {
        totalUsers: number;
        totalSites: number;
        totalProducts: number;
        totalOrders: number;
    };
}

export default function BackupClient({ stats }: BackupClientProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [confirmText, setConfirmText] = useState("");
    const [restoreStatus, setRestoreStatus] = useState<string>("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === "application/json" || file.name.endsWith(".json")) {
                setSelectedFile(file);
                toast.success(`File ${file.name} dipilih!`);
            } else {
                toast.error("Hanya file backup .json yang diperbolehkan.");
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            toast.success(`File ${file.name} dipilih!`);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleExport = async () => {
        setIsExporting(true);
        const exportToast = toast.loading("Mengekspor seluruh isi database...");
        try {
            const response = await fetch("/api/admin/backup");
            if (!response.ok) throw new Error("Export failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            
            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `backup-situsbisnis-${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success("Backup berhasil diunduh!", { id: exportToast });
        } catch (error) {
            console.error(error);
            toast.error("Gagal melakukan backup database.", { id: exportToast });
        } finally {
            setIsExporting(false);
        }
    };

    const handleRestore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;
        if (confirmText !== "RESTORE") {
            toast.error("Harap ketik 'RESTORE' untuk konfirmasi.");
            return;
        }

        setIsRestoring(true);
        setRestoreStatus("Membaca file backup...");
        const restoreToast = toast.loading("Memulai proses pemulihan...");

        try {
            const fileText = await selectedFile.text();
            let backupData;
            try {
                backupData = JSON.parse(fileText);
            } catch {
                throw new Error("File JSON tidak valid atau rusak.");
            }

            if (!backupData.data || !backupData.data.users) {
                throw new Error("Struktur file backup tidak valid.");
            }

            setRestoreStatus("Mengirim data pemulihan...");
            const response = await fetch("/api/admin/backup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(backupData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || "Gagal memulihkan database.");
            }

            setRestoreStatus("Selesai! Memperbarui tampilan...");
            toast.success("Database berhasil dipulihkan!", { id: restoreToast });
            
            // Reload page after a delay to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Pemulihan database gagal.", { id: restoreToast });
            setIsRestoring(false);
            setRestoreStatus("");
        }
    };

    return (
        <div className="space-y-8 relative pb-20">
            {/* Overlay Loading progress restore */}
            {isRestoring && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[999] flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center space-y-2 max-w-md px-6">
                        <h3 className="text-xl font-bold text-foreground">Pemulihan Sedang Berjalan</h3>
                        <p className="text-sm text-muted-foreground uppercase font-black tracking-widest">{restoreStatus}</p>
                        <p className="text-xs text-amber-500 font-medium">⚠️ Jangan tutup atau segarkan halaman ini selama proses berlangsung!</p>
                    </div>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card/40 border border-border/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-md transition-all duration-300 hover:border-primary/20">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">User Akun</p>
                        <p className="text-xl font-black text-foreground">{stats.totalUsers}</p>
                    </div>
                </div>
                
                <div className="bg-card/40 border border-border/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-md transition-all duration-300 hover:border-primary/20">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Situs Tenant</p>
                        <p className="text-xl font-black text-foreground">{stats.totalSites}</p>
                    </div>
                </div>

                <div className="bg-card/40 border border-border/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-md transition-all duration-300 hover:border-primary/20">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Produk</p>
                        <p className="text-xl font-black text-foreground">{stats.totalProducts}</p>
                    </div>
                </div>

                <div className="bg-card/40 border border-border/60 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-md transition-all duration-300 hover:border-primary/20">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Transaksi</p>
                        <p className="text-xl font-black text-foreground">{stats.totalOrders}</p>
                    </div>
                </div>
            </div>

            {/* Split Backup & Restore Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column Export */}
                <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                                <Database size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Backup Database Platform</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ekspor Seluruh Data Akun & Website</p>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Fitur ini akan membungkus seluruh data platform Anda, termasuk kredensial pengguna, pengaturan langganan, aset situs, produk ecommerce, transaksi invoice, konten artikel, struktur menu, dan metadata SEO ke dalam sebuah berkas tunggal terenkripsi JSON.
                        </p>

                        <div className="p-4 bg-muted/30 border border-border/50 rounded-2xl space-y-2">
                            <h4 className="text-[10px] font-black uppercase text-foreground tracking-widest flex items-center gap-1.5">
                                <ShieldAlert size={12} className="text-primary" /> Informasi Penting:
                            </h4>
                            <ul className="text-[10px] font-medium text-muted-foreground space-y-1 list-disc pl-4">
                                <li>Ekspor data tidak memengaruhi database aktif yang sedang berjalan.</li>
                                <li>Aset berkas fisik (gambar/video) di R2/S3 tidak terunduh, melainkan rujukan tautan URL media di database tetap terpelihara lengkap.</li>
                                <li>Jaga keamanan file backup Anda dengan ketat karena berisi data sensitif klien.</li>
                            </ul>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-primary hover:bg-primary/95 text-primary-foreground font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 select-none cursor-pointer group"
                    >
                        {isExporting ? (
                            <>
                                <RefreshCw className="animate-spin" size={16} />
                                Mengekspor Data...
                            </>
                        ) : (
                            <>
                                <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                                Mulai Ekspor Data (.json)
                            </>
                        )}
                    </button>
                </div>

                {/* Column Import (Restore) */}
                <div className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Pemulihan (Restore) Database</h3>
                                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Timpa Seluruh Data Saat Ini</p>
                            </div>
                        </div>

                        {/* WARNING PREPARATION WARNING BOX */}
                        <div className="p-4 bg-red-500/5 border border-red-500/25 rounded-2xl space-y-2">
                            <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5">
                                <AlertTriangle size={12} /> Peringatan Kritis Kehilangan Data!
                            </h4>
                            <p className="text-[10px] font-medium text-red-500/80 leading-relaxed">
                                Proses pemulihan ini akan menghapus dan mengganti seluruh akun pengguna, pengaturan, invoice transaksi, serta seluruh website tenant aktif dengan versi berkas backup yang diunggah. Sesi admin aktif Anda tidak akan terputus.
                            </p>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                                dragActive 
                                    ? "border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/5" 
                                    : selectedFile 
                                        ? "border-emerald-500/40 bg-emerald-500/[0.02]" 
                                        : "border-border hover:border-muted-foreground/40 hover:bg-muted/10"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={triggerFileInput}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept=".json" 
                                onChange={handleFileChange}
                            />
                            {selectedFile ? (
                                <div className="space-y-2 flex flex-col items-center">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full">
                                        <Check size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-foreground">{selectedFile.name}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-black">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="space-y-2 flex flex-col items-center">
                                    <div className="p-3 bg-muted rounded-full text-muted-foreground">
                                        <Upload size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-foreground">Unggah File Backup (.json)</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Seret dan lepas file di sini atau klik untuk mencari</p>
                                </div>
                            )}
                        </div>

                        {/* Confirmation Box (Enabled only when file selected) */}
                        {selectedFile && (
                            <form onSubmit={handleRestore} className="space-y-4 pt-2 animate-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <label htmlFor="confirm-restore" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">
                                        Konfirmasi Pemulihan
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">
                                        Ketik <span className="font-bold text-red-500">RESTORE</span> di bawah ini untuk mengonfirmasi bahwa Anda memahami bahwa seluruh data aktif akan digantikan:
                                    </p>
                                    <input 
                                        id="confirm-restore"
                                        type="text" 
                                        required
                                        placeholder="Ketik RESTORE" 
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 transition-colors uppercase tracking-widest text-center"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={confirmText !== "RESTORE" || isRestoring}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-red-600/20 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer"
                                >
                                    <RefreshCw size={16} className={isRestoring ? "animate-spin" : ""} />
                                    Mulai Pemulihan Database
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
