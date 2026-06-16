import React from "react";
import { getTenant } from "@/lib/domains/tenant";
import { notFound } from "next/navigation";
import Link from "next/link";


import { getPlatformSettings } from "@/lib/settings/platform";
import { Metadata } from "next";

export const revalidate = 3600; // Cache page secara statis selama 1 jam (ISR)

export async function generateMetadata(): Promise<Metadata> {
    const platform = await getPlatformSettings();
    return {
        title: `Kebijakan Privasi - ${platform.siteName}`,
        description: `Panduan mengenai kebijakan privasi dan perlindungan data pribadi Anda di ${platform.siteName}.`
    };
}

export default async function PrivacyPage() {
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
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">Kebijakan Privasi</h1>
                        <p className="text-slate-500 text-sm italic">
                            Terakhir diperbarui: 5 Juni 2026 • Waktu baca 2 menit
                        </p>
                    </header>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Komitmen Privasi</h2>
                        <p className="leading-relaxed mb-4">
                            Kami menghargai privasi Anda seperti kami menghargai privasi kami sendiri. Kebijakan ini menjelaskan bagaimana data yang Anda berikan dikumpulkan, digunakan, dan dilindungi di platform kami. Ketentuan penggunaan layanan kami secara umum diatur dalam <Link href="/terms" className="text-primary hover:underline font-semibold">Syarat & Ketentuan</Link> terpisah.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Data yang Kami Kumpulkan</h2>
                        <p className="leading-relaxed mb-4">
                            Data yang kami kumpulkan hanya digunakan untuk menjalankan dan meningkatkan kualitas layanan:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li><strong>Data Akun:</strong> Nama lengkap dan email yang Anda gunakan untuk pendaftaran.</li>
                            <li><strong>Data Situs:</strong> Konten, aset, dan konfigurasi website yang Anda bangun melalui platform kami.</li>
                            <li><strong>Data Teknis:</strong> Alamat IP, jenis browser, dan data analitik dasar demi menjaga keamanan dan kelancaran platform.</li>
                        </ul>
                        <p className="leading-relaxed font-semibold text-slate-900">
                            Kami berkomitmen penuh untuk tidak pernah menjual data pribadi Anda kepada pihak ketiga mana pun.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Kontrol Atas Data Anda</h2>
                        <p className="leading-relaxed mb-4">
                            Sebagai pemilik data, Anda memiliki kontrol penuh. Melalui dashboard, Anda dapat:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Memperbarui atau mengubah informasi profil akun Anda kapan saja.</li>
                            <li>Mengekspor konten dan data situs Anda jika ingin bermigrasi.</li>
                            <li>Menghapus situs atau akun Anda secara permanen.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Hukum yang Berlaku</h2>
                        <p className="leading-relaxed mb-4">
                            Platform {platform.siteName} dikelola dan dioperasikan dari Indonesia. Kami patuh sepenuhnya pada hukum perlindungan data pribadi dan aturan hukum UU ITE yang berlaku di Republik Indonesia.
                        </p>
                    </section>

                    <footer className="mt-16 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-400 text-sm">
                            Ada pertanyaan mengenai data pribadi Anda? Hubungi kami di <a href={`mailto:${contactEmail}`} className="text-primary hover:underline">{contactEmail}</a>
                        </p>
                    </footer>
                </article>
            </main>
        </div>
    );
}
