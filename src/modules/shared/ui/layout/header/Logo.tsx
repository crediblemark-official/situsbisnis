"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SiteSettings } from "@/types/site-settings";

interface LogoProps {
    settings: SiteSettings | null;
    textColor: string;
}

export function Logo({ settings, textColor }: LogoProps) {
    const displayMode = settings?.logoDisplayMode || "both";
    const hasLogo = !!settings?.logoUrl;

    const showLogoImage = hasLogo && (displayMode === "logo" || displayMode === "both");
    const showText = displayMode === "text" || displayMode === "both" || (displayMode === "logo" && !hasLogo);

    return (
        <Link href="/" className="flex items-center gap-3 group">
            {showLogoImage && settings?.logoUrl && (
                <div className={showText 
                    ? "relative h-10 w-10 transition-transform group-hover:scale-105" 
                    : "relative h-10 w-40 sm:h-12 sm:w-48 transition-transform group-hover:scale-105"
                }>
                    <Image
                        src={settings.logoUrl}
                        alt={settings?.siteName || "SitusBisnis Logo"}
                        fill
                        priority={true}
                        sizes={showText ? "40px" : "(max-width: 640px) 160px, 192px"}
                        className="object-contain object-left"
                    />
                </div>
            )}
            {showText && (
                <span className="text-xl font-black tracking-tighter uppercase" style={{ color: textColor }}>
                    {settings?.siteName || "SitusBisnis"}
                </span>
            )}
        </Link>
    );
}
