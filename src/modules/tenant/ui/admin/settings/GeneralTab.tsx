import React from "react";
import { Settings, Lock } from "lucide-react";
import { Switch } from "@/components/ui/Switch";

interface GeneralTabProps {
    config: any;
    setConfig: (_config: any) => void;
}

export function GeneralTab({ config, setConfig }: GeneralTabProps) {
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <Settings size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Konfigurasi Global</h3>
                </div>
                <div className="p-4 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="settings-site-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Identitas Platform</label>
                            <input
                                id="settings-site-name"
                                type="text"
                                value={config.siteName || ""}
                                onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="e.g. My Awesome SaaS"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="settings-support-email" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Dukungan Utama</label>
                            <input
                                id="settings-support-email"
                                type="email"
                                value={config.contactEmail || ""}
                                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="support@platform.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="settings-contact-phone" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nomor Telepon Kontak</label>
                            <input
                                id="settings-contact-phone"
                                type="text"
                                value={config.contactPhone || ""}
                                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="+62 ..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="settings-whatsapp" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nomor WhatsApp</label>
                            <input
                                id="settings-whatsapp"
                                type="text"
                                value={config.whatsappNumber || ""}
                                onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="62..."
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label htmlFor="settings-address" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alamat Kantor</label>
                            <textarea
                                id="settings-address"
                                value={config.footerAddress || ""}
                                onChange={(e) => setConfig({ ...config, footerAddress: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30 min-h-[80px]"
                                placeholder="Jakarta, Indonesia"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2 pt-4 border-t border-border">
                            <label htmlFor="settings-affiliate-rate" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Persentase Komisi Afiliasi (%)</label>
                            <input
                                id="settings-affiliate-rate"
                                type="number"
                                min="0"
                                max="100"
                                value={config.affiliateCommissionRate || 20}
                                onChange={(e) => setConfig({ ...config, affiliateCommissionRate: Number(e.target.value) })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="20"
                            />
                            <p className="text-[10px] text-muted-foreground">Persentase keuntungan yang diberikan kepada afiliator setiap kali berhasil membawa pengguna berlangganan.</p>
                        </div>
                        <div className="md:col-span-2 pt-4 border-t border-border flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-foreground uppercase tracking-tight">Komisi Afiliasi Berulang (Recurring)</p>
                                <p className="text-[10px] text-muted-foreground font-medium opacity-60 mt-1 uppercase tracking-widest leading-relaxed">
                                    Aktifkan jika afiliator berhak mendapatkan komisi dari perpanjangan paket pengguna. Jika dinonaktifkan, komisi hanya diberikan untuk transaksi pertama.
                                </p>
                            </div>
                            <Switch
                                checked={config.affiliateRecurringCommission ?? false}
                                onChange={(val: boolean) => setConfig({ ...config, affiliateRecurringCommission: val })}
                            />
                        </div>
                        {config.affiliateRecurringCommission && (
                            <div className="md:col-span-2 space-y-2 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
                                <label htmlFor="settings-affiliate-recurring-rate" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Persentase Komisi Perpanjangan / Recurring (%)</label>
                                <input
                                    id="settings-affiliate-recurring-rate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={config.affiliateRecurringCommissionRate !== undefined ? config.affiliateRecurringCommissionRate : 10}
                                    onChange={(e) => setConfig({ ...config, affiliateRecurringCommissionRate: Number(e.target.value) })}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                    placeholder="10"
                                />
                                <p className="text-[10px] text-muted-foreground">Persentase keuntungan yang diberikan kepada afiliator untuk transaksi perpanjangan atau pembayaran berulang berikutnya.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <Lock size={16} className="text-rose-500" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Keamanan & Registrasi</h3>
                </div>
                <div className="p-4 md:p-8">
                    <div className="flex items-center justify-between p-4 bg-muted/5 border border-border/50 rounded">
                        <div>
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Pendaftaran Publik</p>
                            <p className="text-[10px] text-muted-foreground font-medium opacity-60 mt-1 uppercase tracking-widest">Izinkan pembuatan akun baru bagi pengguna umum.</p>
                        </div>
                        <Switch
                            checked={config.allowRegistration}
                            onChange={(val: boolean) => setConfig({ ...config, allowRegistration: val })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
