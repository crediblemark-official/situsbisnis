import React from "react";
import { Mail, Eye, EyeOff, ExternalLink } from "lucide-react";

interface EmailTabProps {
    config: any;
    setConfig: (_config: any) => void;
}

export function EmailTab({ config, setConfig }: EmailTabProps) {
    const [showApiKey, setShowApiKey] = React.useState(false);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Konfigurasi Gateway Email (Resend)</h3>
                </div>

                <div className="p-4 md:p-8 space-y-8 max-w-3xl">
                    {/* Info Banner */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-4">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                            <Mail size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Integrasi Resend Email API</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest">
                                Masukkan kunci API Resend untuk mengaktifkan pengiriman email transaksi otomatis seperti email sambutan registrasi, bukti pembayaran/invoice, reset password, dan pemberitahuan sistem.
                            </p>
                            <a
                                href="https://resend.com/docs"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold uppercase tracking-widest mt-1 transition-colors"
                            >
                                <ExternalLink size={10} />
                                Dokumentasi Resend
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Resend API Key */}
                        <div className="space-y-2">
                            <label htmlFor="resend-api-key" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Resend API Key
                            </label>
                            <div className="relative">
                                <input
                                    id="resend-api-key"
                                    type={showApiKey ? "text" : "password"}
                                    value={config.resendApiKey || ""}
                                    onChange={(e) => setConfig({ ...config, resendApiKey: e.target.value })}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 pr-12 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30 font-mono"
                                    placeholder="re_xxxxxxxxxxxxxx"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground opacity-60">
                                Dapatkan API Key Anda dari dashboard Resend → API Keys.
                            </p>
                        </div>

                        {/* Email Sender Name */}
                        <div className="space-y-2">
                            <label htmlFor="email-sender-name" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Nama Pengirim Default (Sender Name)
                            </label>
                            <input
                                id="email-sender-name"
                                type="text"
                                value={config.emailSenderName || ""}
                                onChange={(e) => setConfig({ ...config, emailSenderName: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="Contoh: SitusBisnis"
                            />
                            <p className="text-[10px] text-muted-foreground opacity-60">
                                Nama yang akan muncul sebagai pengirim email di kotak masuk penerima.
                            </p>
                        </div>

                        {/* Email Sender Address */}
                        <div className="space-y-2">
                            <label htmlFor="email-sender-address" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Alamat Email Pengirim Default (Sender Email)
                            </label>
                            <input
                                id="email-sender-address"
                                type="email"
                                value={config.emailSenderAddress || ""}
                                onChange={(e) => setConfig({ ...config, emailSenderAddress: e.target.value })}
                                className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all placeholder:opacity-30"
                                placeholder="Contoh: noreply@situsbisnis.com"
                            />
                            <p className="text-[10px] text-muted-foreground opacity-60">
                                Alamat email pengirim. Gunakan domain yang telah terverifikasi di dashboard Resend Anda.
                            </p>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-3 p-4 bg-muted/10 border border-border/50 rounded-lg">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.resendApiKey ? "bg-primary shadow-md shadow-primary/30 animate-pulse" : "bg-muted-foreground/30"}`} />
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                            {config.resendApiKey
                                ? "API Key terkonfigurasi — Gateway Email Resend siap digunakan"
                                : "API Key belum diatur — Email dalam mode simulasi (hanya dicetak ke log konsol)"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
