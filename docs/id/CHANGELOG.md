# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Belum Dirilis]

### Ditambahkan
- Logging terstruktur dengan Pino (`lib/core/logger.ts`)
- Rate limiting API via middleware (`lib/core/rate-limit.ts`)
- Endpoint health check (`/api/health`)
- Integrasi monitoring error Sentry
- Dokumentasi OpenAPI/Swagger (`/api/openapi`)
- Pengujian aksesibilitas dengan axe-core
- Plugin ESLint jsx-a11y untuk aturan aksesibilitas
- Husky pre-commit hooks dengan lint-staged
- Docker Compose dengan PostgreSQL untuk pengembangan lokal
- Template `.env.example`
- File CODEOWNERS untuk otomatisasi review kode
- Panduan CONTRIBUTING.md
- SECURITY.md untuk pelaporan kerentanan
- Catatan Keputusan Arsitektur (ADR)
- Runbook Operasional
- Template PR dan Issue
- Threshold coverage di konfigurasi vitest (70% lines/functions/statements)
- Otomatisasi migrasi database di CI/CD
- Dokumentasi versioning API

### Diubah
- Memigrasikan seluruh rute API `/src/app/api/...` menjadi **Thin Controller** dengan arsitektur **Modular Monolith & Layered Architecture** (Facade -> Action -> Service -> Repository).
- Memecah berkas service `billing.service.ts` (~1400 baris) menjadi 6 sub-service modular yang masing-masing berukuran di bawah 300 baris (`limit`, `plan`, `coupon`, `withdrawal`, `checkout`, `platform`).
- Memindahkan kueri database langsung pada rute API (seperti `/api/admin/*`, `/api/billing/*`, `/api/credbuild`, `/api/analytics`, `/api/health`, `/api/ai`, dll.) ke repositori domain masing-masing.
- Memperbaiki dependensi lintas modul pada `search.service.ts` dengan memanfaatkan facade `CatalogClient` untuk mematuhi aturan isolasi Modular Monolith.
- Memperbaiki 15 error TypeScript di credbuild.config.tsx
- Memperbaiki 49 peringatan ESLint (import tidak terpakai)
- Menghapus `ignoreBuildErrors` dari next.config.js
- Memperketat validasi environment (fail fast di production)
- Mengintegrasikan rate limiting ke middleware proxy.ts
- Mengganti `console.error` dengan logging terstruktur di CRUD handler
- Meningkatkan error boundary dengan integrasi Sentry
- Memperbarui konfigurasi ESLint dengan aturan jsx-a11y
- Meningkatkan Docker Compose dengan health checks dan networking

### Diperbaiki
- Error kompilasi TypeScript (0 error sekarang)
- Peringatan ESLint untuk import tidak terpakai
- Masalah iterasi Map pada rate limiter
- Pesan error validasi environment
- Asosiasi label A11y di halaman auth

### Keamanan
- Menambahkan rate limiting API (100 req/15menit default, 20 req/15menit untuk auth)
- Menambahkan logging terstruktur untuk audit trail
- Menambahkan validasi variabel environment dengan persyaratan ketat
- Menambahkan security headers ke semua respons
- Menambahkan Sentry untuk monitoring error real-time

## [1.0.0] - 2026-05-16

### Rilis Awal
- CMS multi-tenant dengan routing subdomain
- Visual page builder dengan 40+ komponen
- Next.js 16 App Router dengan React 19
- Prisma ORM dengan PostgreSQL
- Autentikasi NextAuth.js
- Kontrol akses berbasis peran (admin, owner, editor, user)
- Dukungan e-commerce (produk, keranjang, pesanan)
- Media library dengan penyimpanan R2/S3
- Rich text editor (Tiptap)
- Dashboard dengan manajemen pengaturan
- Sistem tagihan langganan
- Dukungan domain kustom dengan verifikasi DNS
- Unit tests (Vitest) + E2E tests (Playwright)
- Pipeline CI/CD dengan GitHub Actions
- Dukungan deployment Docker
