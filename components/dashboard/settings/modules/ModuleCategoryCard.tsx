"use client";

import React from "react";
import { FormSwitch } from "@/components/ui/Form";
import { CreditCard } from "lucide-react";
import { isFeatureEnabled } from "@/lib/billing/features";

interface ModuleCategoryCardProps {
    category: any;
    settings: any;
    setSettings: (_val: any) => void;
    plan: string;
    planFeatures: any;
}

export function ModuleCategoryCard({ category, settings, setSettings, plan, planFeatures }: ModuleCategoryCardProps) {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-primary/20">
            <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        {category.icon}
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{category.title}</h3>
                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight opacity-60">{category.description}</p>
                    </div>
                </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {category.modules.map((mod: any) => {
                    const isLocked = !isFeatureEnabled(plan, planFeatures, mod.planKey);
                    const isEnabled = !!(settings as any)[mod.id];
                    
                    const limitMap: Record<string, string> = {
                        "enabledPosts": "maxPosts",
                        "enabledGallery": "maxAssets",
                        "enabledProducts": "maxProducts",
                        "enabledTestimonials": "maxTestimonials",
                    };
                    const limitKey = limitMap[mod.id];
                    const limitValue = limitKey ? (planFeatures as any)?.[limitKey] : undefined;

                    return (
                        <div 
                            key={mod.id} 
                            className={`relative p-5 rounded-xl border transition-all duration-300 ${
                                isLocked 
                                    ? "bg-muted/5 border-border/50 opacity-40 cursor-not-allowed" 
                                    : isEnabled 
                                        ? "bg-primary/[0.03] border-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]"
                                        : "bg-background border-border hover:border-primary/20 shadow-sm"
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2 rounded-lg transition-colors duration-300 ${
                                    isLocked 
                                        ? 'bg-muted text-muted-foreground/30' 
                                        : isEnabled 
                                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                                            : 'bg-primary/5 text-primary'
                                }`}>
                                    {mod.icon}
                                </div>
                                {isLocked ? (
                                    <span className="text-[7px] font-black bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                        <CreditCard size={8} /> PREMIUM
                                    </span>
                                ) : typeof limitValue === 'number' && (
                                    <span className="text-[7px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest border border-primary/10">
                                        Limit: {limitValue === -1 ? "∞" : limitValue}
                                    </span>
                                )}
                            </div>
                            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1">{mod.label}</h4>
                            <p className="text-[9px] text-muted-foreground font-medium leading-tight mb-4">{mod.desc}</p>
                            
                            <div className="flex items-center justify-end border-t border-border/30 pt-3">
                                <FormSwitch 
                                    label="" 
                                    description="" 
                                    checked={!!(settings as any)[mod.id]} 
                                    onChange={(val) => {
                                        let newSettings = { ...settings, [mod.id]: val };
                                        if (mod.id === "enabledOrders" && val === false) {
                                            newSettings.enabledWhatsappCheckout = true;
                                        }
                                        if (mod.id === "enabledWhatsappCheckout" && val === false && !settings.enabledOrders) {
                                            newSettings.enabledOrders = true;
                                        }
                                        setSettings(newSettings);
                                    }} 
                                    disabled={isLocked}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
