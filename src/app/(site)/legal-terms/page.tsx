import React from "react";
import nextDynamic from "next/dynamic";
import { Metadata } from "next";
import { getPage } from "@/modules/content/services/content-display.service";
import { getSiteSettings } from "@/modules/tenant/services/site-settings.service";
import { FileText, Award, ShoppingBag, Landmark } from "lucide-react";
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

// Komponen Syarat & Ketentuan Default (Fallback)
function DefaultTermsPage({ siteName, brandColor, contactEmail }: { siteName: string; brandColor: string; contactEmail: string }) {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-700 font-sans py-12 sm:py-20">
      <main className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="relative p-8 sm:p-12 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
            <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: brandColor }} />
            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider mb-4" style={{ color: brandColor }}>
              <FileText size={16} />
              <span>Aturan & Ketentuan</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Syarat & Ketentuan Penggunaan
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              Terakhir diperbarui: Juni 2026 • Mengikat seluruh transaksi belanja di {siteName}
            </p>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-800">
                  <Award size={16} />
                </div>
                1. Ketentuan Umum Layanan
              </h2>
              <p className="leading-relaxed text-sm">
                Dengan mengakses, menjelajahi, atau melakukan transaksi di website <strong>{siteName}</strong>, Anda menyatakan telah membaca, memahami, dan setuju untuk terikat pada aturan-aturan yang tertulis di bawah ini. Jika Anda tidak menyetujui salah satu poin ketentuan, mohon untuk tidak melanjutkan penggunaan website atau melakukan transaksi pembelian.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-800">
                  <ShoppingBag size={16} />
                </div>
                2. Proses Transaksi & Ketentuan Produk
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed">
                <li>Pembeli wajib memberikan informasi kontak, alamat email, dan alamat pengiriman secara benar dan lengkap pada form checkout.</li>
                <li>Semua harga produk tertera dalam mata uang lokal dan dapat berubah sewaktu-waktu atas kebijakan pemilik toko.</li>
                <li>Pesanan akan dianggap sah dan diproses setelah pembayaran pembeli berhasil dikonfirmasi secara resmi oleh sistem pembayaran otomatis kami.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-850">
                  <Landmark size={16} />
                </div>
                3. Aturan Pembayaran (Payment Gateway)
              </h2>
              <p className="leading-relaxed text-sm">
                Guna memberikan kemudahan dan kenyamanan belanja, pembayaran pesanan diproses dengan ketentuan berikut:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm leading-relaxed">
                <li><strong>Pembayaran Otomatis (Instant):</strong> Diproses melalui gerbang pembayaran aman <strong>Duitku</strong>. Pembeli wajib menyelesaikan transaksi sebelum batas waktu kedaluwarsa instruksi pembayaran berakhir agar pesanan tidak dibatalkan otomatis oleh sistem.</li>
                <li><strong>Transfer Bank Manual:</strong> Pembeli wajib mengirimkan bukti transfer yang valid ke kontak resmi toko apabila memilih metode transfer manual agar proses verifikasi dapat diselesaikan oleh admin.</li>
                <li>Setiap biaya tambahan administrasi yang dibebankan oleh penyedia metode pembayaran (apabila ada) merupakan tanggung jawab pembeli sepenuhnya.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1 rounded bg-slate-100 text-slate-800">
                  <FileText size={16} />
                </div>
                4. Pembatalan Transaksi & Hukum yang Berlaku
              </h2>
              <p className="leading-relaxed text-sm">
                Pembatalan transaksi yang telah lunas tunduk pada kebijakan pengembalian produk pemilik toko. Seluruh perselisihan yang timbul sehubungan dengan transaksi pembelian di website ini akan diselesaikan secara musyawarah dan tunduk pada koridor hukum yang berlaku di wilayah Republik Indonesia.
              </p>
            </section>

            <section className="pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Butuh informasi lebih lanjut mengenai ketentuan penggunaan toko kami? Hubungi kami di:
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
  const pageData = await getPage("/terms");

  if (!pageData) {
    const settings = await getSiteSettings();
    const siteTitle = settings.siteName || "Toko Kami";
    return {
      title: `Syarat & Ketentuan - ${siteTitle}`,
      description: `Halaman Syarat & Ketentuan resmi untuk transaksi dan aturan di ${siteTitle}.`
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
export default async function LegalTermsPage() {
  const data = await getPage("/terms");
  const settings = await getSiteSettings();

  // Jika tidak ada halaman kustom di database, render default template
  if (!data) {
    const siteName = settings.siteName || "Toko Kami";
    const brandColor = settings.brandColor || "#0ea5e9";
    const contactEmail = settings.contactEmail || settings.brandSupportEmail || "support@situsbisnis.com";
    return <DefaultTermsPage siteName={siteName} brandColor={brandColor} contactEmail={contactEmail} />;
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const baseUrl = getBaseUrl(host);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "headline": data.title || "Terms of Service",
    "description": data.description,
    "url": `${baseUrl}/terms`,
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
            id="ld-json-custom-terms"
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
          id="ld-json-body-terms"
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
        id="ld-json-fallback-terms"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Client data={data.data as any} />
    </>
  );
}
