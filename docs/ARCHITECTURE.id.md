# Arsitektur Teknis

1001-Web dibangun dengan fokus pada modularitas, keamanan, dan performa tinggi.

## Stack Teknologi
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router dengan Turbopack)
- **Visual Builder**: [CredBuild](https://build.crediblemark.com) 
- **Database**: [Prisma ORM](https://www.prisma.io/) dengan PostgreSQL
- **Styling**: Vanilla CSS dengan Tailwind CSS v4 untuk layouts
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
- `/src/app`: Rute halaman dan API (Next.js App Router).
- `/src/modules`: Folder batas logis (Logical Boundaries) berisi modul-modul domain bisnis:
  - `auth`: Fitur login, akun, NextAuth
  - `billing`: Fitur langganan SaaS, transaksi, pembayaran
  - `catalog`: Fitur produk, kupon, manajemen katalog
  - `content`: Fitur postingan blog, tiptap editor, media, testimonial
  - `order`: Fitur pembelian dan pesanan e-commerce
  - `tenant`: Fitur situs tenant, domain kustom
  - `shared`: Utilitas, komponen UI, hooks, core engine visual builder yang dipakai bersama.
- `/prisma`: Skema database ter-decouple (tanpa relasi fisik lintas modul).
- `/tests`: Script pengujian unit (Vitest) dan end-to-end (Playwright).

---

## Arsitektur Berlapis (Layered Architecture)
Setiap modul di bawah `/src/modules` (selain `shared`) mengadopsi empat lapisan demi pemisahan tanggung jawab yang jelas:
1. **Facade Layer (`index.ts`)**: Titik masuk resmi modul (misal `CatalogClient`). Hanya memanggil `actions.ts`.
2. **Action Layer (`actions.ts`)**: Menerima input, memproses otentikasi dasar/konteks sesi Next.js, dan mendelegasikan ke *Service*.
3. **Service Layer (`services/*.service.ts`)**: Tempat semua logika bisnis divalidasi dan diolah.
4. **Repository Layer (`repositories/*.repository.ts`)**: Satu-satunya bagian dalam modul yang diperbolehkan melakukan pemanggilan langsung ke database (`db`).
