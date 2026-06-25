"use client";

import React, { useEffect, useState } from "react";
import { LazyLink as Link } from "@/components/ui/LazyLink";
import Image from "next/image";
import { Eye, Share2, Facebook, Instagram, Twitter, Linkedin, MessageCircle, Send, Youtube, Music } from "lucide-react";
import { SiteSettings } from "@/types/site-settings";


interface FooterProps {
    initialSettings?: SiteSettings | null;
    initialMenuItems?: any[];
    isTenant?: boolean;
}

export default function Footer({ initialSettings, initialMenuItems = [], isTenant = false }: FooterProps) {
    const [settings, setSettings] = useState<SiteSettings | null>(initialSettings || null);
    const [menuItems, setMenuItems] = useState<any[]>(initialMenuItems);
    const [stats, setStats] = useState({ totalViews: 0, todayViews: 0 });

    useEffect(() => {
        if (!initialSettings || (!initialSettings.socialTiktok && !initialSettings.socialYoutube)) {
            fetch("/api/settings")
                .then((res) => res.json())
                .then((data) => setSettings(data))
                .catch((err) => console.error(err));
        }

        if (initialMenuItems.length === 0) {
            fetch("/api/menus?slug=footer")
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.items) {
                        setMenuItems(data.items.sort((a: any, b: any) => a.order - b.order));
                    }
                })
                .catch((err) => console.error(err));
        }

        // Fetch Analytics
        fetch("/api/analytics")
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(err => console.error("Failed to fetch analytics", err));
    }, [initialSettings, initialMenuItems]);

    const backgroundColor = settings?.footerBackgroundColor || "#0369a1";
    const textColor = settings?.footerTextColor || "#ffffff";

    // Memeriksa apakah menu dinamis tenant sudah memiliki link hukum (terms & privacy)
    const hasTerms = menuItems.some(
        (item) => item.url === "/terms" || item.url?.endsWith("/terms")
    );
    const hasPrivacy = menuItems.some(
        (item) => item.url === "/privacy" || item.url?.endsWith("/privacy")
    );


    return (
        <footer className="w-full font-sans shadow-[0_-15px_30px_rgba(0,0,0,0.08)] border-t border-border/20 relative z-20">
            {/* Top Bar: Background Color */}
            <div className="py-6" style={{ backgroundColor, color: textColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">

                    {/* Logo Area */}
                    <div className="flex-shrink-0 flex flex-col items-center md:items-start">
                        {settings?.logoUrl ? (
                            <div className="relative h-12 w-48 transition-transform hover:scale-105">
                                <Image
                                    src={settings.logoUrl}
                                    alt={settings.siteName || "Logo"}
                                    fill
                                    priority
                                    sizes="200px"
                                    className="object-contain object-center md:object-left"
                                />
                            </div>
                        ) : (
                            <span className="text-2xl font-bold">{settings?.siteName || "Logo"}</span>
                        )}
                    </div>

                    {/* Share Section - Native Share or Social Links */}
                    <div className="flex items-center gap-3">
                        {[
                            settings?.socialFacebook, settings?.socialInstagram, settings?.socialTwitter,
                            settings?.socialLinkedin, settings?.socialTelegram, settings?.socialWhatsapp,
                            settings?.socialTiktok, settings?.socialYoutube
                        ].some(link => link && link.trim() !== "") ? (
                            <div className="flex items-center gap-2">
                                {settings?.socialFacebook?.trim() && (
                                    <a href={settings.socialFacebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="Facebook">
                                        <Facebook size={18} />
                                    </a>
                                )}
                                {settings?.socialInstagram?.trim() && (
                                    <a href={settings.socialInstagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="Instagram">
                                        <Instagram size={18} />
                                    </a>
                                )}
                                {settings?.socialTwitter?.trim() && (
                                    <a href={settings.socialTwitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="Twitter">
                                        <Twitter size={18} />
                                    </a>
                                )}
                                {settings?.socialLinkedin?.trim() && (
                                    <a href={settings.socialLinkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="LinkedIn">
                                        <Linkedin size={18} />
                                    </a>
                                )}
                                {settings?.socialTelegram?.trim() && (
                                    <a href={settings.socialTelegram} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="Telegram">
                                        <Send size={18} />
                                    </a>
                                )}
                                {settings?.socialWhatsapp?.trim() && (
                                    <a href={settings.socialWhatsapp} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="WhatsApp">
                                        <MessageCircle size={18} />
                                    </a>
                                )}
                                {settings?.socialTiktok?.trim() && (
                                    <a href={settings.socialTiktok} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="TikTok">
                                        <Music size={18} />
                                    </a>
                                )}
                                {settings?.socialYoutube?.trim() && (
                                    <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/20" aria-label="YouTube">
                                        <Youtube size={18} />
                                    </a>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    const shareData = {
                                        title: settings?.siteName || "SitusBisnis",
                                        text: `Cek website keren ini: ${settings?.siteName || 'SitusBisnis'}`,
                                        url: window.location.href,
                                    };
                                    try {
                                        if (navigator.share) {
                                            await navigator.share(shareData);
                                        } else {
                                            await navigator.clipboard.writeText(window.location.href);
                                            alert("Link berhasil disalin!");
                                        }
                                    } catch (err) {
                                        console.log("Share failed or cancelled", err);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white text-primary hover:bg-slate-50 transition-all rounded-full border border-white group cursor-pointer"
                            >
                                <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">Bagikan ke Teman</span>
                            </button>
                        )}
                    </div>

                    {/* View Count */}
                    {isTenant && (
                        <div className="bg-background text-foreground px-6 py-3 rounded-lg shadow-md border border-border/10 flex items-center gap-2 text-sm font-medium">
                            <Eye size={18} />
                            <span>{stats.totalViews} total views, {stats.todayViews} views today</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Middle Bar: Dynamic Background - Address */}
            <div
                className="backdrop-blur-sm py-4 border-y border-border/50 shadow-sm relative z-10"
                style={{
                    backgroundColor: settings?.footerAddressBackgroundColor || "#ffffff",
                    color: settings?.footerAddressTextColor || "#0f172a"
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm md:text-base font-bold">
                    {settings?.footerAddress || `${settings?.siteName || "SitusBisnis"} - Platform Website Instan No. 1 di Indonesia`}
                </div>
            </div>

            {/* Bottom Bar: Background Color - Links & Copyright */}
            <div className="py-4" style={{ backgroundColor, color: textColor }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm font-bold">
                    <div className="flex flex-wrap justify-center gap-6">
                        {menuItems.length > 0 ? (
                            <>
                                {menuItems.map((item, idx) => (
                                    <Link key={idx} href={item.url} target={item.target} className="hover:underline">
                                        {item.label}
                                    </Link>
                                ))}
                                {/* Selalu tampilkan terms & privacy untuk tenant jika belum terdaftar di menu dinamis */}
                                {isTenant && !hasTerms && (
                                    <Link href="/terms" className="hover:underline">Syarat & Ketentuan</Link>
                                )}
                                {isTenant && !hasPrivacy && (
                                    <Link href="/privacy" className="hover:underline">Kebijakan Privasi</Link>
                                )}
                            </>
                        ) : (
                            // Fallback jika menu footer khusus tidak diatur
                            isTenant ? (
                                <>
                                    <Link href="/terms" className="hover:underline">Syarat & Ketentuan</Link>
                                    <Link href="/privacy" className="hover:underline">Kebijakan Privasi</Link>
                                </>
                            ) : (
                                <>
                                    <a href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/about`} className="hover:underline">Tentang {settings?.siteName || "SitusBisnis"}</a>
                                    <a href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/contact`} className="hover:underline">Hubungi Kami</a>
                                    <a href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/terms`} className="hover:underline">Syarat & Ketentuan</a>
                                    <a href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/privacy`} className="hover:underline">Kebijakan Privasi</a>
                                </>
                            )
                        )}
                    </div>
                    <div>
                        {settings?.footerCopyright || "© All Rights Reserved."}
                    </div>
                </div>
            </div>

        </footer>
    );
}
