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
- `/src/modules`: Folder batas logis (Logical Boundaries) berisi modul-modul domain bisnis. Setiap modul memiliki folder `ui` sendiri untuk komponen UI spesifik fitur bisnisnya:
  - `auth`: Fitur login, akun, NextAuth (serta UI manajemen user, kupon, transaksi admin)
  - `billing`: Fitur langganan SaaS, transaksi, pembayaran (serta UI billing & langganan dashboard)
  - `catalog`: Fitur produk, kupon, manajemen katalog (serta UI toko, product details & dashboard produk)
  - `content`: Fitur postingan blog, tiptap editor, media, testimonial (serta UI editor tiptap, blog share, & media dashboard)
  - `order`: Fitur pembelian dan pesanan e-commerce (serta UI checkout dashboard & subsite)
  - `tenant`: Fitur situs tenant, domain kustom (serta UI setting, backup & info expired site)
  - `shared`: Utilitas, hooks, core engine visual builder yang dipakai bersama. Khusus untuk `shared/ui/ui` hanya berisi komponen atomik dasar (Button, Input, Badge, Dialog, dsb).
- `/prisma`: Skema database ter-decouple (tanpa relasi fisik lintas modul).
- `/tests`: Script pengujian unit (Vitest) dan end-to-end (Playwright).

---

## Arsitektur Berlapis (Layered Architecture)
Setiap modul di bawah `/src/modules` (selain `shared`) mengadopsi struktur berlapis demi pemisahan tanggung jawab yang jelas dan modularitas maksimal:
1. **Facade Layer (`index.ts`)**: Titik masuk resmi kontrak modul untuk modul luar (misal `CatalogClient`). Lapisan ini mengekspos logic service melalui controller/handler internal.
2. **Action Layer (`actions.ts` jika ada)**: Menerima input, memproses otentikasi dasar/konteks sesi Next.js, dan mendelegasikan ke *Service*.
3. **Service Layer (`services/*.service.ts`)**: Tempat semua logika bisnis divalidasi dan diolah secara granular.
4. **Repository Layer (`repositories/*.repository.ts`)**: Satu-satunya bagian dalam modul yang diperbolehkan melakukan pemanggilan langsung ke database (`db`).
5. **Presentation Layer (`ui/` subfolder)**: Komponen antarmuka pengguna (React/Next.js) yang khusus melayani fitur di dalam modul bersangkutan. Pemisahan UI ini di tingkat folder mencegah terjadinya circular dependencies dan masalah bundling server-side dependency (seperti `ioredis`) ke client-side.
