"use client";

import React, { useState } from "react";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { updateAdminSettingsAction } from "@/modules/subscription/public-actions";

// Modular Components
import { GeneralTab } from "@/components/admin/settings/GeneralTab";
import { PlansTab } from "@/components/admin/settings/PlansTab";
import { PaymentsTab } from "@/components/admin/settings/PaymentsTab";
import { StorageTab } from "@/components/admin/settings/StorageTab";
import { AITab } from "@/components/admin/settings/AITab";
import { WhatsAppTab } from "@/components/admin/settings/WhatsAppTab";
import { EmailTab } from "@/components/admin/settings/EmailTab";

export default function SettingsForm({ initialData }: { initialData: any }) {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<"general" | "plans" | "payments" | "storage" | "ai" | "whatsapp" | "email">("general");
    const [config, setConfig] = useState(initialData || {
        siteName: "My Platform",
        contactEmail: "support@nextcms.com",
        contactPhone: "",
        whatsappNumber: "",
        footerAddress: "",
        subdomain: "admin",
        allowRegistration: true,
        affiliateCommissionRate: initialData?.affiliateCommissionRate || 20,
        affiliateRecurringCommission: initialData?.affiliateRecurringCommission ?? false,
        affiliateRecurringCommissionRate: initialData?.affiliateRecurringCommissionRate || 10,
        aiProvider: initialData?.aiProvider || "gemini",
        aiApiKey: initialData?.aiApiKey || "",
        resendApiKey: initialData?.resendApiKey || "",
        emailSenderName: initialData?.emailSenderName || "",
        emailSenderAddress: initialData?.emailSenderAddress || "",
        plans: [],
        paymentMethods: [],
        paymentGateway: initialData?.paymentGateway || "midtrans",
        gatewayMerchantId: initialData?.gatewayMerchantId || "",
        gatewayClientKey: initialData?.gatewayClientKey || "",
        gatewayApiKey: initialData?.gatewayApiKey || "",
        gatewaySandbox: initialData?.gatewaySandbox ?? true,
        gatewayApiType: initialData?.gatewayApiType || "snap",
        storage: {
            accessKeyId: initialData?.storage?.accessKeyId || "",
            secretAccessKey: initialData?.storage?.secretAccessKey || "",
            bucketName: initialData?.storage?.bucketName || "",
            publicDomain: initialData?.storage?.publicDomain || "",
            endpoint: initialData?.storage?.endpoint || ""
        }
    });

    const handleSave = async () => {
        setLoading(true);
        setSaved(false);

        try {
            const res = await updateAdminSettingsAction(config);
            if (res.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert(res.error || "Gagal menyimpan pengaturan");
            }
        } catch (_error) {
            alert("Kesalahan koneksi internet");
        } finally {
            setLoading(false);
        }
    };

    const addPaymentMethod = () => {
        setConfig({
            ...config,
            paymentMethods: [
                ...config.paymentMethods,
                { id: `new-${Date.now()}`, bankName: "", accountNumber: "", accountHolder: "", instructions: "" }
            ]
        });
    };

    const removePaymentMethod = (id: string) => {
        setConfig({
            ...config,
            paymentMethods: config.paymentMethods.filter((p: any) => p.id !== id)
        });
    };

    const updatePaymentMethod = (id: string, data: any) => {
        setConfig({
            ...config,
            paymentMethods: config.paymentMethods.map((p: any) => p.id === id ? { ...p, ...data } : p)
        });
    };

    const updatePlan = (id: string, data: any) => {
        setConfig({
            ...config,
            plans: config.plans.map((p: any) => p.id === id ? { ...p, ...data } : p)
        });
    };

    const addPlan = () => {
        const newPlan = {
            id: `new-${Date.now()}`,
            name: "PAKET BARU",
            description: "Deskripsi paket...",
            price: 0,
            priceYearly: 0,
            originalPrice: 0,
            originalPriceYearly: 0,
            trialDays: 14,
            maxSites: 1,
            maxPosts: 10,
            maxProducts: 0,
            maxAssets: 50,
            maxTestimonials: 0,
            maxOrders: 0,
            addonSiteBilling: "one_time",
            showInPricing: true,
            hasBlog: true,
            hasGallery: true,
            hasOrders: false,
            hasCart: false,
            hasCustomDomain: false,
            hasProducts: false,
            hasPortfolio: false,
            hasTaxonomies: true,
            hasTestimonials: false,
            hasInbox: true,
            hasCustomers: false,
            features: {
                addonSitePrice: 0
            }
        };
        setConfig({
            ...config,
            plans: [...config.plans, newPlan]
        });
    };

    const removePlanFromState = (id: string) => {
        if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) return;
        setConfig({
            ...config,
            plans: config.plans.filter((p: any) => p.id !== id)
        });
    };

    return (
        <div className="w-full animate-in fade-in duration-700 pb-20 space-y-6 text-foreground">
            <PageHeader
                title="Pengaturan Platform"
                subtitle="Pusat kendali parameter platform, pengelolaan paket langganan, dan metode pembayaran global."
            >
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : saved ? (
                        <CheckCircle2 size={14} />
                    ) : (
                        <Save size={14} />
                    )}
                    {loading ? "Sinkronisasi..." : saved ? "Pengaturan Disimpan" : "Simpan Pengaturan"}
                </button>
            </PageHeader>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-md w-full md:w-fit border border-border/50 overflow-x-auto no-scrollbar">
                {(["general", "plans", "payments", "storage", "ai", "whatsapp", "email"] as const).map((tab) => {
                    const tabLabels: Record<string, string> = {
                        general: "Umum",
                        plans: "Daftar Paket",
                        payments: "Pembayaran",
                        storage: "Penyimpanan",
                        ai: "AI",
                        whatsapp: "WhatsApp",
                        email: "Email"
                    };
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all ${activeTab === tab ? "bg-background text-primary shadow-sm shadow-black/5" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            {tabLabels[tab] || tab}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-8">
                <div className="space-y-6">
                    {activeTab === "general" && (
                        <GeneralTab config={config} setConfig={setConfig} />
                    )}

                    {activeTab === "plans" && (
                        <PlansTab 
                            plans={config.plans} 
                            setPlans={(plans) => setConfig({ ...config, plans })}
                            addPlan={addPlan}
                            removePlan={removePlanFromState}
                            updatePlan={updatePlan}
                        />
                    )}

                    {activeTab === "payments" && (
                        <PaymentsTab 
                            paymentMethods={config.paymentMethods}
                            addPaymentMethod={addPaymentMethod}
                            removePaymentMethod={removePaymentMethod}
                            updatePaymentMethod={(id, field, value) => updatePaymentMethod(id, { [field]: value })}
                            gatewayMerchantId={config.gatewayMerchantId}
                            gatewayClientKey={config.gatewayClientKey}
                            gatewayApiKey={config.gatewayApiKey}
                            gatewaySandbox={config.gatewaySandbox}
                            gatewayApiType={config.gatewayApiType}
                            onChangeGatewaySettings={(field, value) => setConfig({ ...config, [field]: value })}
                        />
                    )}

                    {activeTab === "storage" && (
                        <StorageTab config={config} setConfig={setConfig} />
                    )}

                    {activeTab === "ai" && (
                        <AITab config={config} setConfig={setConfig} />
                    )}

                    {activeTab === "whatsapp" && (
                        <WhatsAppTab config={config} setConfig={setConfig} />
                    )}

                    {activeTab === "email" && (
                        <EmailTab config={config} setConfig={setConfig} />
                    )}
                </div>
            </div>
        </div>
    );
}
