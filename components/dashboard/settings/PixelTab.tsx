import React from "react";
import { FormSection, FormInput } from "@/components/ui/Form";
import { SiteSettings } from "@/lib/settings/site";
import { AlertCircle } from "lucide-react";

interface PixelTabProps {
    settings: SiteSettings;
    onChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

// WarningCard menampilkan kotak peringatan validasi dengan warna kontras tinggi yang adaptif di mode terang (light) dan gelap (dark).
const WarningCard = ({ title, issue, suggestion }: { title: string; issue: string; suggestion: string }) => (
    <div className="flex gap-2.5 p-3 rounded bg-amber-500/10 dark:bg-amber-500/5 border border-amber-200/60 dark:border-border/50 border-l-2 border-l-amber-500 text-amber-900 dark:text-amber-200/90 text-[11px] leading-relaxed animate-in fade-in duration-300 shadow-sm">
        <AlertCircle size={14} className="text-amber-700 dark:text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
            <div className="font-bold text-amber-950 dark:text-amber-400">{title}</div>
            <div>
                <span className="font-semibold text-amber-950 dark:text-white">Issue:</span> {issue}
            </div>
            <div>
                <span className="font-semibold text-amber-950 dark:text-white">Suggestion:</span> {suggestion}
            </div>
        </div>
    </div>
);

export const PixelTab = ({ settings, onChange }: PixelTabProps) => {
    const [isValidatingGtm, setIsValidatingGtm] = React.useState(false);
    const [isGtmServerValid, setIsGtmServerValid] = React.useState<boolean | null>(null);

    const metaPixelId = (settings.metaPixelId || "").trim();
    const isMetaPixelInvalid = !!metaPixelId && !/^[0-9]{13,17}$/.test(metaPixelId);

    const googleAnalyticsId = (settings.googleAnalyticsId || "").trim();
    const isGoogleAnalyticsInvalid = !!googleAnalyticsId && !/^G-[a-zA-Z0-9]{10}$/.test(googleAnalyticsId);

    const googleTagManagerId = (settings.googleTagManagerId || "").trim();
    const isGoogleTagManagerInvalid = !!googleTagManagerId && !/^GTM-[A-Z0-9]{4,8}$/.test(googleTagManagerId);

    const tiktokPixelId = (settings.tiktokPixelId || "").trim();
    const isTiktokPixelInvalid = !!tiktokPixelId && !/^[a-zA-Z0-9]{10,25}$/.test(tiktokPixelId);

    // Debounced Server-side Google Tag Manager Validation
    React.useEffect(() => {
        const value = googleTagManagerId;
        if (!value || !/^GTM-[A-Z0-9]{4,8}$/.test(value)) {
            const timer = setTimeout(() => {
                setIsGtmServerValid(null);
                setIsValidatingGtm(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const handler = setTimeout(async () => {
            setIsValidatingGtm(true);
            try {
                const res = await fetch(`/api/settings/validate?type=gtm&value=${value}`);
                if (res.ok) {
                    const data = await res.json();
                    setIsGtmServerValid(data.valid);
                } else {
                    setIsGtmServerValid(false);
                }
            } catch {
                setIsGtmServerValid(false);
            } finally {
                setIsValidatingGtm(false);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [googleTagManagerId]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <FormSection title="Tracking Pixel" description="Tambahkan ID Pixel untuk melacak konversi dan pengunjung dari berbagai platform.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <FormInput
                            label="Meta (Facebook) Pixel ID"
                            name="metaPixelId"
                            value={settings.metaPixelId || ""}
                            onChange={onChange}
                            placeholder="Contoh: 1234567890"
                        />
                        {isMetaPixelInvalid && (
                            <WarningCard
                                title="[browser] [Meta Pixel] - Invalid pixel ID"
                                issue="The pixel ID format is incorrect. Meta Pixel IDs must be 13-17 digit numeric codes."
                                suggestion="Please copy the numeric ID directly from your Facebook Events Manager."
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <FormInput
                            label="Google Analytics ID"
                            name="googleAnalyticsId"
                            value={settings.googleAnalyticsId || ""}
                            onChange={onChange}
                            placeholder="Contoh: G-XXXXXXXXXX"
                        />
                        {isGoogleAnalyticsInvalid && (
                            <WarningCard
                                title="[browser] [Google Analytics] - Invalid measurement ID"
                                issue="The measurement ID format is incorrect. GA4 Measurement IDs must start with 'G-' followed by exactly 10 alphanumeric characters."
                                suggestion="Please go to Google Analytics -> Admin -> Data Streams and copy the Measurement ID."
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <FormInput
                            label="Google Tag Manager ID"
                            name="googleTagManagerId"
                            value={settings.googleTagManagerId || ""}
                            onChange={onChange}
                            placeholder="Contoh: GTM-XXXXXXX"
                        />
                        {isValidatingGtm && (
                            <div className="text-[11px] text-muted-foreground animate-pulse pl-1">
                                Memvalidasi ID kontainer dengan server Google...
                            </div>
                        )}
                        {isGoogleTagManagerInvalid && (
                            <WarningCard
                                title="[browser] [Google Tag Manager] - Invalid container ID"
                                issue="The container ID format is incorrect. GTM IDs must start with 'GTM-' followed by 4-8 uppercase alphanumeric characters."
                                suggestion="Please copy the container ID starting with 'GTM-' from your GTM dashboard."
                            />
                        )}
                        {!isGoogleTagManagerInvalid && isGtmServerValid === false && !isValidatingGtm && (
                            <WarningCard
                                title="[server] [Google Tag Manager] - Container not found or unpublished"
                                issue="Google GTM server returned 404. This container ID does not exist or has never been published."
                                suggestion="Ensure the container ID is correct and you have clicked 'Publish' at least once in your GTM workspace."
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <FormInput
                            label="TikTok Pixel ID"
                            name="tiktokPixelId"
                            value={settings.tiktokPixelId || ""}
                            onChange={onChange}
                            placeholder="Contoh: C1234567890"
                        />
                        {isTiktokPixelInvalid && (
                            <WarningCard
                                title="[browser] [TikTok Pixel] - Invalid pixel ID"
                                issue="The pixel ID is invalid. TikTok Pixel IDs must be 10-25 alphanumeric characters."
                                suggestion="Please go to Events Manager and find the correct pixel ID."
                            />
                        )}
                    </div>
                </div>

                <div className="text-[11px] text-muted-foreground/60 italic leading-relaxed pt-3 border-t border-border/40 mt-4">
                    * Catatan: Karena kebijakan privasi & keamanan platform masing-masing, Meta (Facebook) Pixel, TikTok Pixel, dan Google Analytics tidak mendukung verifikasi status server secara anonim tanpa token autentikasi. Validasi untuk platform tersebut dilakukan berdasarkan format standar.
                </div>
            </FormSection>
        </div>
    );
};


