"use client";

import React from "react";
import { FormSection, FormSwitch } from "@/components/ui/Form";
import { MessageSquare } from "lucide-react";

interface GlobalInteractionsProps {
    settings: any;
    setSettings: (_val: any) => void;
    onSettingsChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function GlobalInteractions({ settings, setSettings, onSettingsChange }: GlobalInteractionsProps) {
    return (
        <FormSection title="Interaksi Global" description="Pengaturan dasar komunikasi (Non-Modular)." icon={<MessageSquare size={16} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="settings-whatsapp" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nomor WhatsApp</label>
                        <input 
                            id="settings-whatsapp"
                            type="text" 
                            name="whatsappNumber" 
                            value={settings.whatsappNumber || ""} 
                            onChange={onSettingsChange} 
                            className="w-full bg-muted/10 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary/40 outline-none transition-all"
                            placeholder="Contoh: 62812..." 
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/5 border border-border/50 rounded-xl">
                    <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">Tombol Chat</p>
                        <p className="text-[9px] text-muted-foreground font-medium opacity-60 mt-1 uppercase tracking-widest">Tampilkan tombol WhatsApp melayang.</p>
                    </div>
                    <FormSwitch 
                        label="" 
                        description="" 
                        checked={!!settings.showFloatingChat} 
                        onChange={(val) => setSettings({ ...settings, showFloatingChat: val })} 
                    />
                </div>
            </div>
        </FormSection>
    );
}
