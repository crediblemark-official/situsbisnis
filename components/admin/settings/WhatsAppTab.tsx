import React from "react";
import { Bot, Eye, EyeOff, ExternalLink } from "lucide-react";

interface WhatsAppTabProps {
    config: any;
    setConfig: (_config: any) => void;
}

export function WhatsAppTab({ config, setConfig }: WhatsAppTabProps) {
    const [showApiKey, setShowApiKey] = React.useState(false);
    const [showDeviceKey, setShowDeviceKey] = React.useState(false);

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="bg-card border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
                    <Bot size={16} className="text-emerald-500" />
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Konfigurasi Gateway WhatsApp (StarSender)</h3>
                </div>

                <div className="p-4 md:p-8 space-y-8 max-w-3xl">
                    {/* Info Banner */}
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-start gap-4">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                            <Bot size={20} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-foreground uppercase tracking-tight">Integrasi StarSender API</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest">
                                Masukkan kunci API StarSender Anda untuk mengaktifkan fitur pengiriman pesan WhatsApp massal, chatbot AI, dan manajemen kampanye dari platform ini.
                            </p>
                            <a
                                href="https://docs.starsender.online"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest mt-1 transition-colors"
                            >
                                <ExternalLink size={10} />
                                Dokumentasi StarSender
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Account API Key */}
                        <div className="space-y-2">
                            <label htmlFor="starsender-api-key" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Account API Key
                            </label>
                            <div className="relative">
                                <input
                                    id="starsender-api-key"
                                    type={showApiKey ? "text" : "password"}
                                    value={config.starsenderApiKey || ""}
                                    onChange={(e) => setConfig({ ...config, starsenderApiKey: e.target.value })}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 pr-12 text-xs font-bold text-foreground focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all placeholder:opacity-30 font-mono"
                                    placeholder="Masukkan Account API Key dari StarSender..."
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
                                Ditemukan di dashboard StarSender → Settings → Account Key. Digunakan untuk operasi manajemen perangkat dan akun.
                            </p>
                        </div>

                        {/* Default Device Key */}
                        <div className="space-y-2">
                            <label htmlFor="starsender-device-key" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Default Device Key (Opsional)
                            </label>
                            <div className="relative">
                                <input
                                    id="starsender-device-key"
                                    type={showDeviceKey ? "text" : "password"}
                                    value={config.starsenderDeviceKey || ""}
                                    onChange={(e) => setConfig({ ...config, starsenderDeviceKey: e.target.value })}
                                    className="w-full bg-muted/10 border border-border/50 rounded px-4 py-3 pr-12 text-xs font-bold text-foreground focus:ring-1 focus:ring-emerald-500/40 outline-none transition-all placeholder:opacity-30 font-mono"
                                    placeholder="Masukkan Device Key default untuk kirim pesan..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowDeviceKey(!showDeviceKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    {showDeviceKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground opacity-60">
                                Ditemukan di dashboard StarSender → Perangkat → Detail Perangkat. Digunakan untuk mengirim pesan dari perangkat WhatsApp yang terhubung.
                            </p>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-3 p-4 bg-muted/10 border border-border/50 rounded-lg">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${config.starsenderApiKey ? "bg-emerald-500 shadow-md shadow-emerald-500/30 animate-pulse" : "bg-muted-foreground/30"}`} />
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                            {config.starsenderApiKey
                                ? "API Key terkonfigurasi — Gateway WhatsApp siap digunakan"
                                : "API Key belum diatur — Fitur WhatsApp Gateway belum aktif"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
