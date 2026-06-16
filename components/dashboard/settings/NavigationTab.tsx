import React from "react";
import { FormSection, FormSelect, FormInput, FormTextArea } from "@/components/ui/Form";
import { SiteSettings } from "@/lib/settings/site";
import { Palette, MousePointer2 } from "lucide-react";

interface NavigationTabProps {
    settings: SiteSettings;
    onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const NavigationTab = ({ settings, onChange }: NavigationTabProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <FormSection title="Pengaturan Header" description="Atur tampilan navigasi atas.">
                <div className="grid grid-cols-1 gap-4">
                    <FormSelect 
                        label="Gaya Header"
                        name="headerStyle"
                        value={settings.headerStyle || "simple"}
                        onChange={onChange}
                        options={[
                            { label: "Minimalis", value: "simple" },
                            { label: "Standar Efek Kaca", value: "standard" },
                            { label: "Melayang (Floating)", value: "floating" }
                        ]}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="header-bg-color" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Palette size={12} /> Warna BG Header
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0">
                                    <input 
                                        type="color" 
                                        name="headerBackgroundColor" 
                                        value={settings.headerBackgroundColor || "#ffffff"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    id="header-bg-color"
                                    type="text" 
                                    name="headerBackgroundColor" 
                                    value={settings.headerBackgroundColor || "#ffffff"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase outline-none" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="header-text-color" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <MousePointer2 size={12} /> Warna Teks Header
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0">
                                    <input 
                                        type="color" 
                                        name="headerTextColor" 
                                        value={settings.headerTextColor || "#111827"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    id="header-text-color"
                                    type="text" 
                                    name="headerTextColor" 
                                    value={settings.headerTextColor || "#111827"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase outline-none" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </FormSection>

            <FormSection title="Pengaturan Footer" description="Atur bagian bawah website.">
                <div className="space-y-4">
                    <FormTextArea 
                        label="Tentang Kami (About)" 
                        name="footerAboutText" 
                        value={settings.footerAboutText || ""} 
                        onChange={onChange} 
                        rows={3} 
                    />
                    <FormTextArea 
                        label="Alamat Lengkap (Address)" 
                        name="footerAddress" 
                        value={settings.footerAddress || ""} 
                        onChange={onChange} 
                        rows={3} 
                    />
                    <FormInput 
                        label="Teks Hak Cipta (Copyright)" 
                        name="footerCopyright" 
                        value={settings.footerCopyright || ""} 
                        onChange={onChange} 
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="footer-bg-color" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Palette size={12} /> Warna BG Footer
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0">
                                    <input 
                                        type="color" 
                                        name="footerBackgroundColor" 
                                        value={settings.footerBackgroundColor || "#111827"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    id="footer-bg-color"
                                    type="text" 
                                    name="footerBackgroundColor" 
                                    value={settings.footerBackgroundColor || "#111827"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase outline-none" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="footer-text-color" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <MousePointer2 size={12} /> Warna Teks Footer
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0">
                                    <input 
                                        type="color" 
                                        name="footerTextColor" 
                                        value={settings.footerTextColor || "#ffffff"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    id="footer-text-color"
                                    type="text" 
                                    name="footerTextColor" 
                                    value={settings.footerTextColor || "#ffffff"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase outline-none" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="footer-address-bg-color" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Palette size={12} /> Warna BG Bar Alamat
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0">
                                    <input 
                                        type="color" 
                                        name="footerAddressBackgroundColor" 
                                        value={settings.footerAddressBackgroundColor || "#1e293b"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    id="footer-address-bg-color"
                                    type="text" 
                                    name="footerAddressBackgroundColor" 
                                    value={settings.footerAddressBackgroundColor || "#1e293b"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase outline-none" 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="footer-address-text-color" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <MousePointer2 size={12} /> Warna Teks Bar Alamat
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0">
                                    <input 
                                        type="color" 
                                        name="footerAddressTextColor" 
                                        value={settings.footerAddressTextColor || "#ffffff"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    id="footer-address-text-color"
                                    type="text" 
                                    name="footerAddressTextColor" 
                                    value={settings.footerAddressTextColor || "#ffffff"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase outline-none" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </FormSection>

            <FormSection title="Media Sosial" description="Hubungkan akun media sosial Anda. Tautan ini akan muncul di footer.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput 
                        label="Facebook URL" 
                        name="socialFacebook" 
                        value={settings.socialFacebook || ""} 
                        onChange={onChange} 
                        placeholder="https://facebook.com/username"
                    />
                    <FormInput 
                        label="Instagram URL" 
                        name="socialInstagram" 
                        value={settings.socialInstagram || ""} 
                        onChange={onChange} 
                        placeholder="https://instagram.com/username"
                    />
                    <FormInput 
                        label="Twitter URL" 
                        name="socialTwitter" 
                        value={settings.socialTwitter || ""} 
                        onChange={onChange} 
                        placeholder="https://twitter.com/username"
                    />
                    <FormInput 
                        label="LinkedIn URL" 
                        name="socialLinkedin" 
                        value={settings.socialLinkedin || ""} 
                        onChange={onChange} 
                        placeholder="https://linkedin.com/in/username"
                    />
                    <FormInput 
                        label="Telegram URL" 
                        name="socialTelegram" 
                        value={settings.socialTelegram || ""} 
                        onChange={onChange} 
                        placeholder="https://t.me/username"
                    />
                    <FormInput 
                        label="WhatsApp Link (wa.me)" 
                        name="socialWhatsapp" 
                        value={settings.socialWhatsapp || ""} 
                        onChange={onChange} 
                        placeholder="https://wa.me/628123456789"
                    />
                    <FormInput 
                        label="TikTok URL" 
                        name="socialTiktok" 
                        value={settings.socialTiktok || ""} 
                        onChange={onChange} 
                        placeholder="https://tiktok.com/@username"
                    />
                    <FormInput 
                        label="YouTube URL" 
                        name="socialYoutube" 
                        value={settings.socialYoutube || ""} 
                        onChange={onChange} 
                        placeholder="https://youtube.com/@channel"
                    />
                </div>
            </FormSection>
        </div>
    );
};
