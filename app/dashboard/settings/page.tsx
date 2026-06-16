"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteSettings } from "@/lib/settings/site";
import {
    Save,
    Globe,
    Palette,
    Search,
    LayoutTemplate,
    Settings,
    Cpu,
    CheckCircle2,
    Info,
    BarChart2
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

// Refactored Tab Components
import { IdentityTab } from "@/components/dashboard/settings/IdentityTab";
import { ModulesTab } from "@/components/dashboard/settings/ModulesTab";
import { BrandingTab } from "@/components/dashboard/settings/BrandingTab";
import { NavigationTab } from "@/components/dashboard/settings/NavigationTab";
import { SEOTab } from "@/components/dashboard/settings/SEOTab";
import { PixelTab } from "@/components/dashboard/settings/PixelTab";

type TabType = "identity" | "modules" | "branding" | "navigation" | "seo" | "pixel";

export default function MasterSettingsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [paymentData, setPaymentData] = useState({
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        currency: "USD",
        instructions: "",
    });

    const [plan, setPlan] = useState<string>("Free");
    const [planPrice, setPlanPrice] = useState<number>(0);
    const [allPlans, setAllPlans] = useState<any[]>([]);
    const [isTrial, setIsTrial] = useState<boolean>(false);
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [planFeatures, setPlanFeatures] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const activeTab = (searchParams.get("tab") as TabType) || "identity";

    useEffect(() => {
        let ignore = false;

        const fetchData = async () => {
            try {
                const [settingsRes, paymentsRes] = await Promise.all([
                    fetch("/api/settings"),
                    fetch("/api/settings/payments")
                ]);

                const settingsJson = await settingsRes.json();
                const paymentsJson = await paymentsRes.json();

                if (!ignore) {
                    setSettings(settingsJson);
                    setPlan(settingsJson.plan || "Free");
                    setPlanPrice(settingsJson.planPrice || 0);
                    setAllPlans(settingsJson.allPlans || []);
                    setIsTrial(settingsJson.isTrial || false);
                    setTrialEndsAt(settingsJson.trialEndsAt || null);
                    setPlanFeatures(settingsJson.planFeatures || {});

                    if (paymentsJson) {
                        setPaymentData({
                            bankName: paymentsJson.bankName || "",
                            accountNumber: paymentsJson.accountNumber || "",
                            accountHolder: paymentsJson.accountHolder || "",
                            currency: paymentsJson.currency || "USD",
                            instructions: paymentsJson.instructions || "",
                        });
                    }
                    setLoading(false);
                }
            } catch (_err) {
                if (!ignore) {
                    console.error(_err);
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => { ignore = true; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const [settingsRes, paymentsRes] = await Promise.all([
                fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(settings),
                }),
                fetch("/api/settings/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    // Sinkronisasi mata uang pembayaran dengan pengaturan umum situs
                    body: JSON.stringify({
                        ...paymentData,
                        currency: settings?.currency || paymentData.currency || "IDR"
                    }),
                })
            ]);

            if (!settingsRes.ok || !paymentsRes.ok) throw new Error("Failed to save");

            setMessage("Pengaturan berhasil disimpan!");
            setTimeout(() => setMessage(""), 3000);
        } catch {
            setMessage("Gagal menyimpan pengaturan.");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (!settings) return;
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const val = target.type === "checkbox" ? target.checked : target.value;
        setPaymentData({ ...paymentData, [target.name]: val });
    };



    if (loading) return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-8">
            <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="flex gap-8">
                <Skeleton className="h-[400px] w-64 hidden md:block" />
                <Skeleton className="h-[600px] flex-1" />
            </div>
        </div>
    );

    if (!settings) return <div className="p-10 text-center font-bold">Gagal memuat pengaturan.</div>;

    const tabs: { id: TabType, label: string, icon: React.ReactNode, description: string }[] = [
        { id: "identity", label: "Identitas", icon: <Globe size={18} />, description: "Informasi dasar situs" },
        { id: "modules", label: "Fitur", icon: <Cpu size={18} />, description: "Aktifkan modul sistem" },
        { id: "branding", label: "Tampilan", icon: <Palette size={18} />, description: "Logo dan warna tema" },
        { id: "navigation", label: "Menu", icon: <LayoutTemplate size={18} />, description: "Header dan Footer" },
        { id: "seo", label: "SEO", icon: <Search size={18} />, description: "Optimasi mesin pencari" },
        { id: "pixel", label: "Pixel", icon: <BarChart2 size={18} />, description: "Meta & TikTok Pixel" },
    ];



    return (
        <form onSubmit={handleSubmit} className="w-full animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
            <PageHeader
                title="Pengaturan Situs"
                subtitle="Kelola konfigurasi website Anda"
                icon={<Settings />}
            >
                <Button
                    type="submit"
                    loading={saving}
                    variant="primary"
                    className="px-6 shadow-lg shadow-primary/20"
                    icon={<Save size={14} />}
                >
                    Simpan Perubahan
                </Button>
            </PageHeader>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Master Tab Rail */}
                <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24 self-start no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                router.push(`/dashboard/settings?tab=${tab.id}`, { scroll: false });
                            }}
                            className={`flex-none lg:w-full flex items-center gap-3 lg:gap-4 py-2 lg:py-3 px-3 rounded-xl lg:rounded-2xl transition-all duration-300 border ${activeTab === tab.id
                                    ? "bg-primary/5 text-primary shadow-sm border-primary/20 scale-[1.02]"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent opacity-70 hover:opacity-100"
                                }`}
                        >
                            <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted"}`}>
                                {tab.icon}
                            </div>
                            <div className="text-left">
                                <p className="text-xs lg:text-sm font-black tracking-tight leading-none">{tab.label}</p>
                                <p className="hidden lg:block text-[10px] font-medium opacity-60 mt-1 leading-none">{tab.description}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content Matrix Area */}
                <div className="flex-1 space-y-4 lg:space-y-6 min-w-0">
                    {activeTab === "identity" && (
                        <IdentityTab settings={settings} onChange={handleChange} />
                    )}

                    {activeTab === "modules" && (
                        <ModulesTab
                            settings={settings}
                            setSettings={setSettings}
                            paymentData={paymentData}
                            onSettingsChange={handleChange}
                            onPaymentChange={handlePaymentChange}
                            plan={plan}
                            planPrice={planPrice}
                            allPlans={allPlans}
                            isTrial={isTrial}
                            trialEndsAt={trialEndsAt}
                            planFeatures={planFeatures}
                        />
                    )}

                    {activeTab === "branding" && (
                        <BrandingTab settings={settings} onChange={handleChange} />
                    )}

                    {activeTab === "navigation" && (
                        <NavigationTab settings={settings} onChange={handleChange} />
                    )}

                    {activeTab === "seo" && (
                        <SEOTab settings={settings} onChange={handleChange} />
                    )}

                    {activeTab === "pixel" && (
                        <PixelTab settings={settings} onChange={handleChange} />
                    )}
                </div>
            </div>

            {/* Notification Status */}
            {message && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-[0.2em] border animate-in fade-in slide-in-from-bottom-4 duration-500 z-50 ${message.includes("Error")
                        ? "bg-red-500 text-white border-red-600"
                        : "bg-primary text-primary-foreground border-primary/20 shadow-xl shadow-primary/20"
                    }`}>
                    <div className="flex items-center gap-3">
                        {message.includes("Error") ? <Info size={16} /> : <CheckCircle2 size={16} />}
                        {message}
                    </div>
                </div>
            )}
        </form>
    );
}
