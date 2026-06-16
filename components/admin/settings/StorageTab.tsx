import React from "react";
import { Server, Image as ImageIcon } from "lucide-react";

interface StorageTabProps {
    config: any;
    setConfig: (_config: any) => void;
}

export function StorageTab({ config, setConfig }: StorageTabProps) {
    const storage = config.storage || {};

    const updateStorage = (field: string, value: string) => {
        setConfig({
            ...config,
            storage: {
                ...storage,
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Konfigurasi Penyimpanan</h3>
                </div>
                <div className="p-4 md:p-8 space-y-6 max-w-3xl">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary shadow-inner">
                            <Server size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Penyimpanan Berkas Aktif</p>
                            <p className="text-[10px] text-muted-foreground font-medium opacity-60 mt-1 uppercase tracking-widest leading-relaxed">
                                Konfigurasikan penyimpanan berkas eksternal kompatibel S3 (seperti Cloudflare R2 atau AWS S3) untuk menyimpan berkas/foto situs pengguna.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="r2-endpoint" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alamat Endpoint Penyimpanan</label>
                            <input
                                id="r2-endpoint"
                                type="text"
                                value={storage.endpoint || ""}
                                onChange={(e) => updateStorage("endpoint", e.target.value)}
                                className="w-full bg-muted/10 border border-border/50 rounded-md px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                placeholder="https://endpoint.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="r2-bucket" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nama Bucket</label>
                            <input
                                id="r2-bucket"
                                type="text"
                                value={storage.bucketName || ""}
                                onChange={(e) => updateStorage("bucketName", e.target.value)}
                                className="w-full bg-muted/10 border border-border/50 rounded-md px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                placeholder="my-bucket"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="r2-access-key" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID Kunci Akses (Access Key ID)</label>
                                <input
                                    id="r2-access-key"
                                    type="text"
                                    value={storage.accessKeyId || ""}
                                    onChange={(e) => updateStorage("accessKeyId", e.target.value)}
                                    className="w-full bg-muted/10 border border-border/50 rounded-md px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all font-mono"
                                    placeholder="Masukkan Access Key ID"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="r2-secret-key" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kunci Akses Rahasia (Secret Access Key)</label>
                                <input
                                    id="r2-secret-key"
                                    type="password"
                                    value={storage.secretAccessKey || ""}
                                    onChange={(e) => updateStorage("secretAccessKey", e.target.value)}
                                    className="w-full bg-muted/10 border border-border/50 rounded-md px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all font-mono"
                                    placeholder="Masukkan Secret Access Key"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="r2-public-domain" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alamat Domain Publik / URL CDN</label>
                            <input
                                id="r2-public-domain"
                                type="text"
                                value={storage.publicDomain || ""}
                                onChange={(e) => updateStorage("publicDomain", e.target.value)}
                                className="w-full bg-muted/10 border border-border/50 rounded-md px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                                placeholder="https://cdn.contoh.com"
                            />
                            <p className="text-[8px] text-muted-foreground mt-1 uppercase tracking-widest opacity-50">Digunakan untuk menampilkan berkas secara publik ke internet. Pastikan alamat ini dapat diakses secara umum.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
