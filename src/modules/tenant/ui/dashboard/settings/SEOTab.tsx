import React from "react";
import { FormSection, FormInput } from "@/components/ui/Form";
import { FormMediaPicker } from "@/components/ui/FormMediaPicker";
import { SiteSettings } from "@/modules/tenant/services/site-settings.service";

interface SEOTabProps {
    settings: SiteSettings;
    onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const SEOTab = ({ settings, onChange }: SEOTabProps) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <FormSection title="Optimasi SEO" description="Atur cara mesin pencari menemukan situs Anda.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Judul SEO (Meta Title)" name="seoTitle" value={settings.seoTitle || ""} onChange={onChange} placeholder="Contoh: %s | Toko Kue" />
                    <FormInput label="Kata Kunci (Keywords)" name="seoKeywords" value={settings.seoKeywords || ""} onChange={onChange} placeholder="kue, roti, enak, murah..." />
                    <FormMediaPicker 
                        label="Gambar SEO (OG Image)" 
                        value={settings.seoImage || ""} 
                        onChange={(val) => onChange({ target: { name: "seoImage", value: val } } as any)} 
                    />
                </div>
            </FormSection>

            <FormSection title="Analitik & Verifikasi" description="Hubungkan dengan alat pelacak Google.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput label="Google Verification ID" name="googleSiteVerificationId" value={settings.googleSiteVerificationId || ""} onChange={onChange} />
                    <FormInput label="Google Analytics ID" name="googleAnalyticsId" value={settings.googleAnalyticsId || ""} onChange={onChange} />
                </div>
            </FormSection>
        </div>
    );
};
