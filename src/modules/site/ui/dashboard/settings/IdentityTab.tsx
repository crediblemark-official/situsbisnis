import React from "react";
import { FormSection, FormInput, FormTextArea, FormSelect } from "@/components/ui/Form";
import { SiteSettings } from "@/modules/site/ui/site-settings";

interface IdentityTabProps {
    settings: SiteSettings;
    onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IdentityTab = ({ settings, onChange }: IdentityTabProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <FormSection title="Identitas Situs" description="Informasi utama mengenai website Anda.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput 
                        label="Nama Situs" 
                        name="siteName" 
                        value={settings.siteName || ""} 
                        onChange={onChange} 
                    />
                    <FormInput 
                        label="Email Kontak" 
                        name="contactEmail" 
                        value={settings.contactEmail || ""} 
                        onChange={onChange} 
                    />
                    <FormInput 
                        label="WhatsApp (Nomor Kontak)" 
                        name="whatsappNumber" 
                        value={settings.whatsappNumber || ""} 
                        onChange={onChange} 
                    />
                    <FormSelect 
                        label="Mata Uang (Global Currency)" 
                        name="currency" 
                        value={settings.currency || "IDR"} 
                        onChange={onChange}
                        options={[
                            { label: "IDR (Rupiah)", value: "IDR" },
                            { label: "USD (US Dollar)", value: "USD" },
                            { label: "EUR (Euro)", value: "EUR" },
                            { label: "SGD (Singapore Dollar)", value: "SGD" },
                        ]} 
                    />

                    <FormTextArea 
                        label="Slogan (Tagline)" 
                        name="tagline" 
                        value={settings.tagline || ""} 
                        onChange={onChange} 
                        className="sm:col-span-2" 
                        rows={2} 
                    />
                    <FormTextArea 
                        label="Deskripsi Situs" 
                        name="description" 
                        value={settings.description || ""} 
                        onChange={onChange} 
                        className="sm:col-span-2" 
                        rows={4} 
                    />
                </div>
            </FormSection>
        </div>
    );
};
