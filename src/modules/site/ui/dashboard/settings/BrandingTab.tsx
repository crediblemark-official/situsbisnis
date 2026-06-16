import React from "react";
import { FormSection, FormSelect } from "@/components/ui/Form";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { SiteSettings } from "@/modules/site/ui/site-settings";

const CURATED_FONTS = [
    { label: "Inter (Sans)", value: "Inter" },
    { label: "Roboto (Sans)", value: "Roboto" },
    { label: "Outfit (Professional)", value: "Outfit" },
    { label: "Playfair Display (Serif)", value: "Playfair Display" },
    { label: "Montserrat (Modern)", value: "Montserrat" },
    { label: "Poppins (Clean)", value: "Poppins" },
    { label: "Open Sans (Friendly)", value: "Open Sans" },
    { label: "Syne (Avant-garde)", value: "Syne" },
    { label: "Unbounded (Wide Bold)", value: "Unbounded" },
    { label: "Space Grotesk (Tech)", value: "Space Grotesk" },
];

interface BrandingTabProps {
    settings: SiteSettings;
    onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const BrandingTab = ({ settings, onChange }: BrandingTabProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <FormSection title="Tema Website" description="Pilih arsitektur visual dasar untuk website Anda.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormSelect 
                        label="Pilihan Tema" 
                        name="activeTheme" 
                        value={settings.activeTheme || "default"} 
                        onChange={onChange} 
                        tooltip="Tema Luxury memberikan estetika gelap premium yang sangat cocok untuk portfolio atau brand eksklusif."
                        options={[
                            { label: "Modern Terang (Clean & Standard)", value: "default" },
                            { label: "Luxury Gelap (Sophisticated & Premium)", value: "luxury" },
                        ]} 
                    />
                </div>
            </FormSection>

            <FormSection title="Logo & Ikon" description="Upload identitas visual website Anda.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormMediaPicker 
                        label="Logo Utama" 
                        value={settings.logoUrl || ""} 
                        onChange={(val) => onChange({ target: { name: "logoUrl", value: val } } as any)} 
                        description="Format: PNG, SVG, atau JPG. Direkomendasikan lebar minimal 250 piksel dengan latar belakang transparan."
                        variant="logo"
                    />
                    <FormMediaPicker 
                        label="Favicon" 
                        value={settings.faviconUrl || ""} 
                        onChange={(val) => onChange({ target: { name: "faviconUrl", value: val } } as any)} 
                        description="Format: PNG, SVG, atau ICO. Ukuran wajib rasio 1:1 persegi (Direkomendasikan 32x32 atau 48x48 piksel)."
                        variant="favicon"
                    />
                    <div className="sm:col-span-2 pt-2">
                        <FormSelect 
                            label="Tampilan Logo di Header" 
                            name="logoDisplayMode" 
                            value={settings.logoDisplayMode || "both"} 
                            onChange={onChange} 
                            tooltip="Pilih bagaimana identitas brand Anda ditampilkan di bagian header website."
                            options={[
                                { label: "Teks Saja (Hanya menampilkan nama situs)", value: "text" },
                                { label: "Logo Saja (Hanya menampilkan gambar logo)", value: "logo" },
                                { label: "Logo + Teks (Menampilkan gambar logo dan nama situs)", value: "both" },
                            ]} 
                        />
                    </div>
                </div>
            </FormSection>

            <FormSection title="Warna Tema" description="Tentukan skema warna website.">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {["brandPrimaryColor", "brandSecondaryColor", "brandAccentColor", "brandBackgroundColor", "brandTextColor"].map((color) => (
                        <div key={color} className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                {color.replace("brand", "").replace("Color", "")}
                            </label>
                            <div className="flex gap-2">
                                <div className="w-9 h-9 rounded-xl border border-border overflow-hidden shrink-0 shadow-inner">
                                    <input 
                                        type="color" 
                                        name={color} 
                                        value={(settings as any)[color] || "#000000"} 
                                        onChange={onChange} 
                                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                                    />
                                </div>
                                <input 
                                    type="text" 
                                    name={color} 
                                    value={(settings as any)[color] || "#000000"} 
                                    onChange={onChange} 
                                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs font-mono uppercase focus:ring-1 focus:ring-primary outline-none" 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </FormSection>

            <FormSection title="Font" description="Pilihan font website.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect label="Font Utama" name="brandFontPrimary" value={settings.brandFontPrimary || "Inter"} onChange={onChange} options={CURATED_FONTS} />
                    <FormSelect label="Font Sekunder" name="brandFontSecondary" value={settings.brandFontSecondary || "Inter"} onChange={onChange} options={CURATED_FONTS} />
                </div>
            </FormSection>
        </div>
    );
};
