# SitusBisnis (Bahasa Indonesia)

Aplikasi Next.js bertenaga untuk membangun dan mengelola konten multi-tenant dengan CredBuild. Dirancang untuk kecepatan, fleksibilitas, dan pengalaman editorial premium.

<p align="center">
  <a href="README.md">English</a> | <a href="README.id.md">Bahasa Indonesia</a>
</p>

## Fitur Utama

- **Magic Edit Mode**: Tambahkan `/edit` pada URL rute publik mana pun untuk langsung masuk ke mode visual editor.
- **Page Builder (CredBuild)**: Pengeditan visual tingkat lanjut dengan komponen modular.
- **Premium Matrix UI**: Dashboard dengan desain ringkas berkepadatan tinggi (high-density) dan estetika netral-gelap.
- **Multi-Tenant Architecture**: Isolasi data yang aman berbasis subdomain atau domain kustom.
- **Path Aliases (@/\*)**: Struktur kode yang bersih dan profesional tanpa import relatif yang dalam.
- **Modern Stack**: Next.js 16 (Turbopack), Bun, Prisma ORM, Tailwind CSS v4, dan Vitest.

## Arsitektur & Standar

### Path Aliases

Kami menggunakan alias `@/*` untuk semua import internal guna menjaga kebersihan kode dan batas arsitektur.

- `@/modules/*`: Batas Logis (Logical Boundaries) domain bisnis utama (auth, billing, catalog, content, order, tenant, shared) dengan Layered Architecture.
- `@/components/*`: Komponen UI dan dashboard global yang dapat digunakan kembali.

### Keamanan & UX

- **ConfirmationModal**: Setiap tindakan destruktif (seperti hapus data) diproteksi oleh modal konfirmasi premium.
- **Site Isolation**: Seluruh query database diisolasi per penyewa dengan aman berbasis subdomain atau domain kustom melalui koordinasi di dalam modul `tenant`.

## Memulai

### Prasyarat

- Node.js 18+ atau **Bun** (Direkomendasikan)
- Database PostgreSQL
- Cloudflare R2 (untuk penyimpanan media)

### Instalasi

1.  **Clone repositori**:
    ```bash
    git clone https://github.com/crediblemark-official/1001_WEB.git
    cd 1001_WEB
    ```
2.  **Instal dependensi**:
    ```bash
    bun install
    ```
3.  **Persiapan Database**:
    ```bash
    bun run prisma:generate
    bun run prisma:db-push
    ```
4.  **Jalankan Development**:
    ```bash
    bun dev
    ```

---

## 💳 Webhook Pembayaran (Duitku)

SitusBisnis menggunakan integrasi **Duitku** untuk memproses pembayaran. Aplikasi ini membedakan secara tegas antara transaksi langganan SaaS (SitusBisnis utama) dengan transaksi pembelian produk di masing-masing subsite tenant:

### 1. Webhook Langganan SaaS (Platform Utama)

- **URL Webhook**: `https://<domain-anda>/api/billing/webhook/duitku`
- **URL Pengembangan Lokal (Localtunnel)**: `https://slimy-pans-roll.loca.lt/api/billing/webhook/duitku`
- **File Rute**: [app/api/billing/webhook/duitku/route.ts](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis/app/api/billing/webhook/duitku/route.ts)
- **Kegunaan**: Memproses pembayaran upgrade plan dan pembelian slot situs tambahan milik penyewa/tenant. Kredensial (Merchant Code & API Key) dimuat secara dinamis dari pengaturan admin global (`PlatformSettings`), bukan ditulis keras (hardcoded) di file `.env`.

### 2. Webhook Pembayaran Produk (Tenant/Subsite)

- **URL Webhook**: `https://<domain-anda>/api/orders/webhook/duitku`
- **URL Pengembangan Lokal (Localtunnel)**: `https://slimy-pans-roll.loca.lt/api/orders/webhook/duitku`
- **File Rute**: [app/api/orders/webhook/duitku/route.ts](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis/app/api/orders/webhook/duitku/route.ts)
- **Kegunaan**: Memproses pembayaran check-out produk e-commerce milik pelanggan toko subsite tenant. Kredensial dinilai secara dinamis berdasarkan konfigurasi pembayaran unik masing-masing toko (`PaymentSettings` di database).

---

## Dokumentasi Terkait

- [Analisis Keamanan](docs/security-analysis.md) - Tinjauan keamanan arsitektur.
- [Panduan Pengembang](docs/creating-hero-components.md) - Cara membuat komponen visual kustom.

---

_Terakhir Diperbarui: Mei 2026_
