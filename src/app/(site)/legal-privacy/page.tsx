import React from "react";
import nextDynamic from "next/dynamic";
import { Metadata } from "next";
import { getPage } from "@/modules/page/ui/content-display";
import { getSiteSettings } from "@/modules/site/ui/site-settings";
import { Shield, Lock, Eye, CheckCircle } from "lucide-react";
import TiptapRenderer from "@/components/editor/TiptapRenderer";
import { generateAutoExcerpt } from "@/lib/editor/render";
import { headers } from "next/headers";
import { getBaseUrl } from "@/lib/domains/utils";
import Script from "next/script";

// Impor komponen Client untuk Visual Builder dari catch-all path
const Client = nextDynamic(() => import("../[...credbuildPath]/client").then(m => m.Client), {
    ssr: true,
    loading: () => <div className="min-h-screen bg-background animate-pulse" />
});

// Komponen Kebijakan Privasi Default (Fallback)
function DefaultPrivacyPage({ siteName, brandColor, contactEmail }: { siteName: string; brandColor: string; contactEmail: string }) {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 font-sans py-12 sm:py-20">
      <main className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="relative p-8 sm:p-12 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: brandColor }} />
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: brandColor }}>
              <Shield size={16} />
              <span>Kebijakan Privasi</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Kebijakan Privasi & Perlindungan Data
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              Terakhir diperbarui: Juni 2026 • Berlaku untuk seluruh pengunjung dan pelanggan {siteName}
            </p>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-800">
                  <Eye size={16} />
                </div>
                1. Informasi Yang Kami Kumpulkan
              </h2>
              <p className="leading-relaxed text-sm">
                Kami mengumpulkan data yang diperlukan untuk memproses pesanan dan meningkatkan pengalaman belanja Anda di <strong>{siteName}</strong>:
              </p>
              <ul className="space-y-2 text-sm pl-2">
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 mt-1 shrink-0" />
                  <span><strong>Informasi Kontak & Pengiriman:</strong> Nama lengkap, alamat email, nomor WhatsApp/telepon, dan alamat pengiriman saat melakukan pembelian.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-emerald-500 mt-1 shrink-0" />
                  <span><strong>Data Transaksi:</strong> Riwayat produk yang Anda beli, total belanja, dan status pembayaran.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-800">
                  <Lock size={16} />
                </div>
                2. Keamanan Pembayaran (Duitku Payment Gateway)
              </h2>
              <p className="leading-relaxed text-sm">
                Keamanan transaksi Anda adalah prioritas utama kami. Oleh karena itu:
              </p>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs sm:text-sm leading-relaxed space-y-2">
                <p>
                  Semua transaksi pembayaran otomatis diproses secara aman melalui payment gateway berlisensi resmi <strong>Duitku</strong>. 
                </p>
                <p className="font-semibold text-slate-800">
                  Toko kami tidak pernah menyimpan data sensitif seperti nomor kartu kredit atau detail akun perbankan Anda. Semua data pembayaran langsung dikirimkan dan diproses secara terenkripsi oleh sistem Duitku.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-800">
                  <Shield size={16} />
                </div>
                3. Penggunaan Informasi Anda
              </h2>
              <p className="leading-relaxed text-sm">
                Informasi pribadi yang dikumpulkan hanya digunakan untuk tujuan operasional toko:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Memproses dan mengirimkan pesanan produk yang Anda beli.</li>
                <li>Mengirimkan konfirmasi status pembayaran dan pengiriman secara real-time.</li>
                <li>Menghubungi Anda apabila terdapat kendala pada stok produk atau kendala teknis pengiriman.</li>
              </ul>
              <p className="text-sm font-semibold text-slate-800 mt-2">
                Kami berkomitmen penuh untuk tidak menjual, menyewakan, atau membagikan informasi pribadi Anda kepada pihak ketiga mana pun untuk tujuan pemasaran tanpa izin tertulis dari Anda.
              </p>
            </section>

            <section className="pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Jika Anda memiliki pertanyaan mengenai perlindungan data pribadi Anda, silakan hubungi kami melalui email:
              </p>
              <a 
                href={`mailto:${contactEmail}`} 
                className="inline-block mt-2 font-bold text-sm hover:underline transition-colors"
                style={{ color: brandColor }}
              >
                {contactEmail}
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

// Menghasilkan Metadata Halaman
export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPage("/privacy");

  if (!pageData) {
    const settings = await getSiteSettings();
    const siteTitle = settings.siteName || "Toko Kami";
    return {
      title: `Kebijakan Privasi - ${siteTitle}`,
      description: `Halaman Kebijakan Privasi resmi untuk transaksi dan data pengguna di ${siteTitle}.`
    };
  }

  const ogTitle = pageData.title || (pageData.data as any)?.root?.props?.title;
  const ogDescription = pageData.description || (pageData.body ? generateAutoExcerpt(pageData.body) : undefined);

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      images: pageData.imageUrl ? [{ url: pageData.imageUrl }] : undefined,
    },
  };
}

// Komponen Halaman Utama
export default async function LegalPrivacyPage() {
  const data = await getPage("/privacy");
  const settings = await getSiteSettings();

  // Jika tidak ada halaman kustom di database, render default template
  if (!data) {
    const siteName = settings.siteName || "Toko Kami";
    const brandColor = settings.brandColor || "#0ea5e9";
    const contactEmail = settings.contactEmail || settings.brandSupportEmail || "support@situsbisnis.com";
    return <DefaultPrivacyPage siteName={siteName} brandColor={brandColor} contactEmail={contactEmail} />;
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const baseUrl = getBaseUrl(host);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "headline": data.title || "Privacy Policy",
    "description": data.description,
    "url": `${baseUrl}/privacy`,
    "image": data.imageUrl ? [data.imageUrl] : undefined,
    "datePublished": data.createdAt,
    "dateModified": data.updatedAt,
  };

  // Jika halaman menggunakan Visual Builder (useBuilder)
  if (data.useBuilder) {
    return (
      <>
        {jsonLd && (
          <Script
            id="ld-json-custom-privacy"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <Client data={data.data as any} />
      </>
    );
  }

  // Jika halaman berupa konten editor Tiptap biasa
  if (data.body && data.body !== "" && data.body !== "{}" && data.body !== '{"type":"doc","content":[]}') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Script
          id="ld-json-body-privacy"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-8">
          <header className="mb-10 text-center">
            {data.title && <h1 className="text-4xl font-extrabold text-foreground sm:text-5xl tracking-tight">{data.title}</h1>}
          </header>
          <div className="prose dark:prose-invert max-w-none">
            <TiptapRenderer content={data.body} />
          </div>
        </div>
      </div>
    );
  }

  // Fallback default rendering jika kosong
  return (
    <>
      <Script
        id="ld-json-fallback-privacy"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Client data={data.data as any} />
    </>
  );
}
