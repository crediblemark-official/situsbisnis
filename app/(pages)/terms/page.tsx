import React from "react";
import { getTenant } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";
import { getPlatformSettings } from "@/lib/settings/platform";
import { Metadata } from "next";

// Cache halaman secara statis selama 1 jam (ISR)
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const platform = await getPlatformSettings();
    return {
        title: `Syarat & Ketentuan - ${platform.siteName}`,
        description: `Syarat & Ketentuan penggunaan platform ${platform.siteName} untuk membuat dan mengelola website instan.`
    };
}

export default async function TermsPage() {
    const subdomain = await getTenant();
    if (subdomain) {
        notFound();
    }

    const platform = await getPlatformSettings();
    const contactEmail = platform.contactEmail || "support@SitusBisnis.com";

    return (
        <div className="min-h-screen bg-white text-slate-800 font-sans">
            <main className="max-w-2xl mx-auto px-6 py-20">
                <article className="prose prose-slate lg:prose-lg mx-auto">
                    <header className="mb-12 border-b border-slate-100 pb-8">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">Syarat & Ketentuan</h1>
                        <p className="text-slate-500 text-sm italic">
                            Terakhir diperbarui: 5 Juni 2026 • Waktu baca 3 menit
                        </p>
                    </header>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Ketentuan Umum</h2>
                        <p className="leading-relaxed mb-4">
                            Selamat datang di {platform.siteName}. Dengan mendaftar dan menggunakan layanan kami, Anda setuju untuk mematuhi dan terikat oleh Syarat & Ketentuan berikut. Mohon baca ketentuan ini dengan saksama.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Pembuatan Akun & Keamanan</h2>
                        <p className="leading-relaxed mb-4">
                            Untuk menggunakan fitur tertentu dari platform kami, Anda diharuskan membuat akun:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Anda wajib memberikan informasi pendaftaran yang akurat, lengkap, dan terbaru.</li>
                            <li>Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi akun Anda.</li>
                            <li>Setiap aktivitas yang terjadi di bawah akun Anda adalah tanggung jawab Anda sepenuhnya.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Penggunaan Layanan yang Diizinkan</h2>
                        <p className="leading-relaxed mb-4">
                            {platform.siteName} dirancang untuk membantu Anda membuat website dengan mudah. Namun, Anda tidak diizinkan untuk:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Mengunggah atau mendistribusikan konten yang melanggar hukum, berbau SARA, pornografi, perjudian, atau tindakan penipuan.</li>
                            <li>Menggunakan layanan kami untuk aktivitas spamming, phishing, atau penyebaran malware.</li>
                            <li>Mengganggu atau mencoba merusak integritas sistem dan infrastruktur jaringan kami.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Hak Kekayaan Intelektual</h2>
                        <p className="leading-relaxed mb-4">
                            Kami menghormati hak kepemilikan Anda terhadap konten yang Anda buat:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Semua konten, logo, gambar, dan data yang Anda unggah ke situs Anda tetap menjadi milik Anda sepenuhnya.</li>
                            <li>Desain template, sistem pembangun halaman, kode sumber, dan hak kekayaan intelektual lain yang disediakan oleh {platform.siteName} adalah milik platform kami.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Pembatasan Tanggung Jawab</h2>
                        <p className="leading-relaxed mb-4">
                            Layanan kami disediakan &quot;sebagaimana adanya&quot; (as is). {platform.siteName} tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari gangguan teknis, kehilangan data, atau kesalahan operasional situs yang dibuat oleh pengguna di platform kami.
                        </p>
                    </section>

                    <footer className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-sm">
                            Ada pertanyaan terkait ketentuan ini? Hubungi kami di <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
                        </p>
                    </footer>
                </article>
            </main>
        </div>
    );
}
