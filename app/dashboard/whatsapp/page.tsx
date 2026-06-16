"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Bot, Sparkles, Send, ShieldCheck, Zap } from "lucide-react";

export default function WhatsAppBotComingSoon() {
  return (
    <div className="w-full animate-in fade-in duration-700 pb-20 space-y-8">
      <PageHeader
        title="WhatsApp AI Bot"
        subtitle="Otomatisasi perpesanan pelanggan dan asisten AI pintar dalam satu klik."
      />

      {/* Hero Coming Soon Card */}
      <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden group flex flex-col items-center text-center max-w-4xl mx-auto">
        {/* Animated ambient backdrop gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700 -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] group-hover:bg-emerald-500/20 transition-all duration-700 -z-10" />

        {/* Central Icon */}
        <div className="relative mb-6">
          <div className="p-5 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 relative z-10 animate-bounce duration-1000">
            <Bot size={48} />
          </div>
          <div className="absolute -inset-2 bg-emerald-500/20 rounded-2xl blur opacity-30 animate-pulse" />
        </div>

        {/* Text Area */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
            <Sparkles size={12} className="animate-spin" /> Coming Soon / Segera Hadir
          </div>
          
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4">
            Sambungkan Bisnis Anda dengan WhatsApp AI Gateway
          </h2>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Fitur integrasi WhatsApp Gateway dan ChatGPT asisten cerdas sedang dipersiapkan. Segera, Anda dapat mengaktifkan chatbot otomatis untuk menjawab pelanggan 24/7, mengirim promo massal, dan memantau interaksi perpesanan langsung dari menu ini.
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6 text-left relative z-10">
          <div className="p-5 bg-muted/20 border border-border/80 rounded-xl hover:border-primary/30 transition-all duration-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg w-fit mb-4">
              <Zap size={20} />
            </div>
            <h4 className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Auto-Reply AI (ChatGPT)</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Koneksikan asisten AI ChatGPT pintar yang otomatis menjawab keluhan, pertanyaan produk, dan closing penjualan 24/7.
            </p>
          </div>

          <div className="p-5 bg-muted/20 border border-border/80 rounded-xl hover:border-emerald-500/30 transition-all duration-300">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg w-fit mb-4">
              <Send size={20} />
            </div>
            <h4 className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Broadcast Campaigns</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Jadwalkan pesan siaran promosi atau pemberitahuan tagihan ke ribuan nomor pelanggan tanpa takut terkena ban.
            </p>
          </div>

          <div className="p-5 bg-muted/20 border border-border/80 rounded-xl hover:border-primary/30 transition-all duration-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-lg w-fit mb-4">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Rotator & Anti-Spam</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bagi beban kirim pesan ke beberapa nomor gateway secara adil menggunakan algoritma Round Robin cerdas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
