# Arsitektur Teknis

1001-Web dibangun dengan fokus pada modularitas, keamanan, dan performa tinggi.

## Stack Teknologi
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Visual Builder**: [CredBuild](https://build.crediblemark.com) 
- **Database**: [Prisma ORM](https://www.prisma.io/) dengan PostgreSQL
- **Styling**: Vanilla CSS dengan Tailwind CSS untuk layout
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Penyimpanan**: Cloudflare R2 (S3-compatible)

---

## Logika Teknis

### 1. Hybrid Routing (The Proxy)
1001-Web menggunakan middleware `proxy.ts` dan rewrite internal untuk menangani dua tipe halaman yang berbeda:
- **Halaman Standar**: Dikelola melalui editor Tiptap dan field database biasa.
- **Halaman Visual**: Dikelola melalui antarmuka CredBuild di `/credbuild`.

Sistem secara otomatis mendeteksi bendera `useBuilder` pada sebuah halaman dan me-render UI yang sesuai.

### 2. Persistensi Data
Model data inti berpusat pada:
- **`CredBuildPage`**: Menyimpan data JSON untuk layout visual builder.
- **`Post` / `Product`**: Model konten standar.
- **`SiteSettings`**: Konfigurasi situs global (Logo, SEO, dll).

### 3. Adaptivitas Lingkungan
1001-Web menyertakan logika dalam `lib/env-manager.ts` dan `app/api/install/status` untuk mendeteksi:
- **Izin Filesystem**: Mendeteksi apakah aplikasi bisa menulis ke `.env`.
- **Variabel Sistem**: Mendeteksi jika konfigurasi sudah disediakan melalui platform hosting.

---

## Struktur Direktori
- `/app`: Next.js App Router (Route dan API).
- `/components`: Komponen UI.
- `/packages/core`: Engine builder utama CredBuild.
- `/lib`: Utilitas bersama (Database, manajemen Env).
- `/prisma`: Skema dan migrasi.
- `/scripts`: Script pemeliharaan berkala.
