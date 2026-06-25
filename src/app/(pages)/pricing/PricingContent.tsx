"use client";

import React, { useState } from "react";
import { Check, Zap, Shield, Crown, ArrowRight, Plus, Info, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Link from "next/link";

interface PricingContentProps {
    plans: any[];
    currency: string;
}

export default function PricingContent({ plans, currency }: PricingContentProps) {
    const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

    return (
        <div className="w-full flex flex-col items-center">
            {/* Highly interactive and premium billing toggle switch */}
            <div className="flex justify-center items-center gap-4 mb-10 md:mb-12 relative z-20">
                <span className={`text-[12px] md:text-sm font-black uppercase tracking-widest transition-colors duration-300 ${billingInterval === 'month' ? 'text-slate-900' : 'text-slate-400'}`}>
                    Bulanan
                </span>
                
                <button
                    type="button"
                    onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                    className="w-16 h-8 bg-slate-200/80 rounded-full p-1 transition-colors duration-300 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500/50 hover:bg-slate-300/80 border border-slate-300/40 flex items-center"
                    aria-label="Toggle interval penagihan"
                >
                    <div className={`w-6 h-6 bg-sky-550 rounded-full transition-transform duration-300 shadow-md ${billingInterval === 'year' ? 'translate-x-8' : 'translate-x-0'}`} />
                </button>
                
                <div className="flex items-center gap-2">
                    <span className={`text-[12px] md:text-sm font-black uppercase tracking-widest transition-colors duration-300 ${billingInterval === 'year' ? 'text-slate-900' : 'text-slate-400'}`}>
                        Tahunan
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center shadow-sm">
                        Hemat ~20% 🔥
                    </span>
                </div>
            </div>

            <div className={`flex lg:grid overflow-x-auto no-scrollbar snap-x snap-mandatory gap-5 lg:gap-6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-auto lg:px-0 ${plans.length === 2 ? 'lg:grid-cols-2 max-w-4xl' : plans.length === 1 ? 'lg:grid-cols-1 max-w-lg' : 'lg:grid-cols-3'} pt-6 md:pt-10 pb-6 items-stretch mb-10 md:mb-14 w-full`}>
                {plans.map((plan) => (
                    <PricingCard 
                        key={plan.id} 
                        plan={plan} 
                        currency={currency} 
                        billingInterval={billingInterval}
                    />
                ))}
            </div>
        </div>
    );
}

function PricingCard({ plan, currency, billingInterval }: { plan: any; currency: string; billingInterval: 'month' | 'year' }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Toggle Calculations
    const isYearly = billingInterval === 'year';
    
    // Choose active price values based on selection
    const displayPrice = isYearly ? (plan.displayPriceYearly || plan.displayPrice) : plan.displayPrice;
    const displayOriginalPrice = isYearly ? plan.displayOriginalPriceYearly : plan.displayOriginalPrice;
    const intervalSuffix = isYearly ? "thn" : "bln";
    
    const rawPrice = isYearly ? (plan.priceYearly || plan.price * 12) : plan.price;
    const rawOriginalPrice = isYearly ? (plan.originalPriceYearly || plan.originalPrice * 12) : plan.originalPrice;
    
    const discountPercent = rawOriginalPrice > 0 ? Math.round((1 - (rawPrice / rawOriginalPrice)) * 100) : 0;

    // Popular tag check
    const isPopular = plan.name.toLowerCase().includes('bisnis') || plan.name.toLowerCase().includes('pro');

    // Dynamic Icon Selection
    const Icon = plan.color === 'blue' ? Zap : 
                  plan.color === 'emerald' ? Shield : 
                  Crown;

    return (
        <div className={`snap-center shrink-0 w-[82vw] md:w-[45vw] lg:w-auto h-full group relative ${isPopular ? 'lg:-translate-y-3' : ''} transition-all duration-500 flex flex-col`}>
            
            {/* Glowing Accent Shadow behind popular card removed based on user request */}

            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-650 text-white text-[9px] font-black uppercase tracking-[0.18em] px-4 py-1.5 rounded-full shadow-lg shadow-sky-500/20 z-20 border border-sky-400/30 flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles size={11} className="animate-spin-slow" /> Paling Populer
                </div>
            )}
            
            <div className={`relative w-full h-full p-5 md:p-6 bg-white/90 backdrop-blur-xl border ${
                isPopular 
                ? 'border-sky-500/30 shadow-[0_20px_50px_-10px_rgba(3,105,161,0.1)] ring-1 ring-sky-500/10' 
                : 'border-slate-200/60 shadow-md shadow-black/[0.01]'
            } rounded-2xl flex flex-col hover:bg-white hover:scale-[1.005] hover:shadow-[0_35px_70px_-15px_rgba(0,0,0,0.06)] transition-all duration-500 flex-1`}>
                
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        plan.color === 'blue' ? 'bg-sky-50 text-sky-500 border border-sky-100' : 
                        plan.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        'bg-indigo-50 text-indigo-650 border border-indigo-100'
                    } group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                        <Icon size={22} />
                    </div>

                    {plan.trialDays > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl border border-orange-100/70 shadow-sm">
                            <Clock size={11} strokeWidth={2.5} className="animate-pulse" />
                            <span className="text-[8.5px] font-black uppercase tracking-wider">{plan.trialDays} Hari Trial</span>
                        </div>
                    )}
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 mb-1.5 tracking-tight group-hover:text-primary transition-colors">{plan.name}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4.5 font-semibold h-10 line-clamp-2">{plan.description || "Solusi website instan terbaik."}</p>
                
                <div className="mb-4.5 flex flex-col">
                    {displayOriginalPrice && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[11px] font-black text-rose-700/80 line-through tracking-tight">{currency} {displayOriginalPrice}</span>
                            {discountPercent > 0 && (
                                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wide border border-rose-100">
                                    Hemat {discountPercent}%
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currency}</span>
                        <span className="text-3xl md:text-4xl font-black text-slate-950 tracking-tighter transition-all duration-300">
                            {displayPrice}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/{intervalSuffix}</span>
                    </div>
                </div>

                {/* Collapsible Details Trigger */}
                <button 
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    aria-expanded={isExpanded}
                    aria-controls={`pricing-details-${plan.id}`}
                    className="flex items-center justify-between w-full py-2.5 px-3 mb-3 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200/40 transition-all duration-200 group/btn focus-visible:ring-2 focus-visible:ring-sky-500/30 focus-visible:outline-none cursor-pointer"
                >
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Info size={11} className="text-sky-500" /> {isExpanded ? "Sembunyikan Detail" : "Lihat Detail Paket"}
                    </span>
                    {isExpanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400 group-hover/btn:translate-y-0.5 transition-transform" />}
                </button>

                {/* Always-visible Addon Billing section */}
                {plan.addonPrice && plan.addonPrice !== "0" && (
                    <div className="p-3 bg-sky-50/60 border border-sky-100/60 rounded-lg flex items-center gap-2.5 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-white text-sky-500 flex items-center justify-center shrink-0 shadow-sm border border-sky-100">
                            <Plus size={12} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-sky-700 uppercase tracking-widest leading-none mb-1">Biaya Tambah Web</p>
                            <p className="text-[11.5px] font-black text-slate-900 leading-none">
                                +{currency} {plan.addonPrice}{plan.addonBilling}
                             </p>
                        </div>
                    </div>
                )}

                {/* Collapsible Detail Features */}
                <div 
                    id={`pricing-details-${plan.id}`}
                    role="region"
                    aria-label={`Rincian detail paket ${plan.name}`}
                    className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0'}`}
                >
                    <div className="overflow-hidden min-h-0">
                        <div className="space-y-4 pb-2">
                            {/* Limits Grid (Beautiful Table) */}
                            <div className="p-3 bg-slate-50 border border-slate-200/40 rounded-lg space-y-2">
                                <h4 className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">
                                    Kapasitas & Limit Kuota
                                </h4>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {plan.limits.map((limit: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-slate-200/20 last:border-0 pb-1.5 last:pb-0">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{limit.label}</span>
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${limit.value === 'Sepuasnya' ? 'bg-sky-50 text-sky-750 border border-sky-100/30' : 'bg-white border border-slate-200/50 text-slate-600'}`}>
                                                {limit.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Core Features List */}
                            <div className="space-y-2.5">
                                <h4 className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Manfaat Paket</h4>
                                {plan.coreFeatures.map((feature: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={8} strokeWidth={3.5} />
                                        </div>
                                        <span className="text-[11.5px] font-semibold text-slate-600 leading-snug">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <Link 
                    href="/register" 
                    className={`mt-auto w-full py-3 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-300 ${
                        isPopular
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20 hover:scale-[1.02] focus-visible:ring-4 focus-visible:ring-sky-500/30' 
                        : 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-slate-900/30'
                    } active:scale-95 focus-visible:outline-none`}
                >
                    Pilih {plan.name} <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );
}

