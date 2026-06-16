"use client";

import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { CTASection } from "@/components/landing/CTASection";

export default function SaaSLandingPage({ platform, plans, siteSettings }: { platform?: any; plans?: any[]; siteSettings?: any }) {
    const siteName = platform?.siteName || siteSettings?.siteName || "SitusBisnis";
    const currency = platform?.currency || siteSettings?.currency || "IDR";
    const whatsappNumber = siteSettings?.whatsappNumber || siteSettings?.socialWhatsapp;

    return (
        <div className="bg-[#FAFAFA] text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
            <HeroSection />
            <ProblemSection />
            <SolutionSection siteName={siteName} />
            <FeaturesGrid />
            <PricingSection plans={plans} currency={currency} />
            <FAQSection siteName={siteName} whatsappNumber={whatsappNumber} />
            <CTASection siteName={siteName} />
        </div>
    );
}
