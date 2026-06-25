"use client";

import React from "react";
import { Monitor, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export function DesktopOnly() {
  const { settings } = usePlatformSettings();
  const platformName = settings?.siteName || "SitusBisnis";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] text-white p-6 overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl mx-auto">
          <Monitor size={48} className="text-white opacity-80" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Khusus Desktop
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed font-medium">
            Visual Builder dirancang untuk layar besar agar Anda bisa berkreasi dengan maksimal. 
            Silakan buka melalui <span className="text-white">Desktop</span> atau <span className="text-white">Laptop</span> untuk pengalaman terbaik.
          </p>
        </div>

        <div className="pt-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-3 bg-white text-black rounded-2xl text-xs font-black hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            <ArrowLeft size={16} />
            Kembali ke Dashboard
          </Link>
        </div>
        
        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest pt-8">
          Powered by {platformName}
        </p>
      </div>
    </div>
  );
}
