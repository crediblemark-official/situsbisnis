# Catatan Keputusan Arsitektur (ADR)

## ADR-001: Arsitektur Multi-Tenant melalui Resolusi Subdomain

**Status:** Diterima
**Tanggal:** 2024-01-15

### Konteks
Platform perlu mendukung banyak penyewa (tenant/situs) dengan data terisolasi, domain kustom, dan routing berbasis subdomain.

### Keputusan
- Menggunakan resolusi tenant berbasis subdomain (`tenant.example.com`)
- Menyimpan data tenant di database PostgreSQL bersama dengan isolasi `siteId`
- Menggunakan middleware Next.js (`proxy.ts`) untuk mendeteksi dan me-routing tenant
- Mendukung domain kustom dengan verifikasi DNS

### Konsekuensi
- **Positif:** Deployment tunggal, infrastruktur bersama, hemat biaya
- **Negatif:** Memerlukan scope query yang hati-hati untuk mencegah kebocoran data
- **Risiko:** Isolasi data tenant bergantung pada penggunaan `siteId` yang benar di semua query

---

## ADR-002: Prisma ORM untuk Layer Database

**Status:** Diterima
**Tanggal:** 2024-01-15

### Konteks
Membutuhkan database layer yang type-safe, mudah dipelihara dengan migrasi dan seeding.

### Keputusan
- Menggunakan Prisma ORM dengan PostgreSQL
- Pattern singleton untuk Prisma client (mencegah proliferasi koneksi HMR)
- Compound unique index untuk pencarian efisien (`siteId_slug`)
- Cascade delete pada relasi situs

### Konsekuensi
- **Positif:** Type safety, tipe auto-generated, migrasi mudah
- **Negatif:** Prisma bisa lebih lambat dari raw SQL untuk query kompleks
- **Risiko:** Batasan koneksi pada deployment serverless

---

## ADR-003: NextAuth.js untuk Autentikasi

**Status:** Diterima
**Tanggal:** 2024-01-15

### Konteks
Membutuhkan autentikasi aman dengan akses kontrol berbasis peran.

### Keputusan
- NextAuth.js v4 dengan Credentials provider
- Strategi sesi JWT dengan custom token callbacks
- Akses berbasis peran: `admin`, `owner`, `editor`, `user`
- Prefix cookie `__Secure-` di production

### Konsekuensi
- **Positif:** Teruji, mendukung banyak provider, default aman
- **Negatif:** v4 sudah lama, v5 memiliki breaking changes
- **Risiko:** Token JWT bisa membesar jika terlalu banyak data disimpan

---

## ADR-004: Pattern Generic CRUD Handler

**Status:** Diterima
**Tanggal:** 2024-02-01

### Konteks
23 grup endpoint API dengan operasi CRUD serupa menyebabkan duplikasi kode.

### Keputusan
- Membuat factory function `createCrudHandler()`
- Bawaan: RBAC, validasi Zod, batasan subscription, pagination
- Setiap endpoint mengonfigurasi: model, schema, roles, tipe limit

### Konsekuensi
- **Positif:** DRY, perilaku konsisten, mudah menambah endpoint baru
- **Negatif:** Kurang fleksibel untuk logika endpoint kustom
- **Risiko:** Over-abstraksi dapat mempersulit debugging

---

## ADR-005: Logging Terstruktur dengan Pino

**Status:** Diterima
**Tanggal:** 2026-05-16

### Konteks
`console.log/error` tidak memadai untuk debugging dan monitoring production.

### Keputusan
- Menggunakan Pino untuk logging JSON terstruktur
- Development: pretty-print dengan warna
- Production: format JSON untuk agregator log
- Child logger per modul via `createLogger(moduleName)`

### Konsekuensi
- **Positif:** Log yang dapat dicari, correlation IDs, integrasi dengan Datadog/ELK
- **Negatif:** Overhead sedikit dibanding console
- **Risiko:** Tidak ada - pattern enterprise standar

---

## ADR-006: Rate Limiting In-Memory

**Status:** Diterima
**Tanggal:** 2026-05-16

### Konteks
Endpoint API membutuhkan perlindungan terhadap penyalahgunaan dan DDoS.

### Keputusan
- Rate limiter in-memory via middleware Next.js
- Limit yang dapat dikonfigurasi per tipe endpoint (auth: 20/15menit, default: 100/15menit)
- Header respons `X-RateLimit-*`
- Respons 429 dengan header `Retry-After`

### Konsekuensi
- **Positif:** Tidak ada dependensi eksternal, cepat, mudah dikonfigurasi
- **Negatif:** Tidak dibagikan antar instance (gunakan Redis untuk skala)
- **Risiko:** Rate limit direset saat server restart

---

## ADR-007: Sentry untuk Monitoring Error

**Status:** Diterima
**Tanggal:** 2026-05-16

### Konteks
Error produksi perlu dilacak, dikelompokkan, dan diperingatkan.

### Keputusan
- Sentry SDK untuk client, server, dan edge runtimes
- Integrasi error boundary di `app/error.tsx`
- Integrasi Replay untuk debugging sisi client
- Sample rate rendah di production (0.1) untuk mengontrol biaya

### Konsekuensi
- **Positif:** Pelacakan error real-time, analisis dampak pengguna, monitoring performa
- **Negatif:** Dependensi eksternal, biaya di skala besar
- **Risiko:** Kebocoran PII jika tidak dikonfigurasi dengan benar (maskAllText diaktifkan)

---

## ADR-008: Modular Monolith dengan Skema Database Decoupled

**Status:** Diterima
**Tanggal:** 2026-06-16

### Konteks
Aplikasi bertumbuh dengan cepat dan integrasi database lintas modul (seperti relasi fisik prisma `@relation` antara `Post` ke `User`, `OrderItem` ke `Product`, dll.) menyebabkan ketergantungan yang sangat erat (high coupling). Ini menyulitkan pengujian unit terisolasi dan mempersulit potensi ekstraksi layanan ke microservices di masa mendatang.

### Keputusan
- Restrukturisasi seluruh kode fungsional menjadi modul-modul terisolasi di bawah `/src/modules` (`auth`, `billing`, `catalog`, `content`, `order`, `tenant`).
- Semua kode infrastruktur, ui global, tema, hooks, utilitas dipusatkan di bawah `/src/modules/shared`.
- Lakukan isolasi batas logis melalui gerbang kontrak tunggal `index.ts` (Facade) di setiap modul domain. Seluruh detail implementasi internal disimpan di `actions.ts`.
- Menerapkan linter arsitektur otomatis (`dependency-cruiser`) untuk melarang impor internal lintas modul secara langsung.
- Hilangkan seluruh relasi fisik database (`@relation`) Prisma ORM lintas modul dan ganti dengan query in-memory menggunakan Facade Client modul (misalnya `CatalogClient.getProductsMap`).

### Konsekuensi
- **Positif:** Batas logis domain bisnis yang jelas, kemudahan pemeliharaan kode, pemisahan database modular yang memungkinkan migrasi ke microservices tanpa mengubah modul pemanggil.
- **Negatif:** Kueri database in-memory mungkin membutuhkan optimasi fetch massal (bulk fetching) untuk menghindari masalah N+1.
- **Risiko:** Pengembang harus disiplin menggunakan Facade Client (`index.ts`) dan dilarang mengimpor file internal modul lain secara langsung.

---

## ADR-009: Event-Driven Design (EDD) via Redis Pub/Sub untuk Komunikasi Modul Decoupled

**Status:** Diusulkan
**Tanggal:** 2026-06-16

### Konteks
Setelah memisahkan skema basis data dan menghapus relasi fisik lintas modul (ADR-008), interaksi antar-modul masih menggunakan panggilan metode sinkron langsung via Facade Client. Hal ini masih menyisakan ketergantungan waktu kompilasi (compile-time dependency) antar-modul (misalnya modul `order` harus mengetahui dan mengimpor Facade modul `billing`). Untuk mencapai pemisahan yang sepenuhnya mandiri (*fully decoupled*), komunikasi antar-modul sebaiknya menggunakan paradigma asinkron berbasis peristiwa (event-driven).

### Keputusan
- Mengadopsi pola **Event-Driven Design (EDD)** untuk komunikasi lintas-modul yang bersifat reaktif dan asinkron (seperti checkout pesanan, pembaruan status langganan, atau pencatatan analitik).
- Menggunakan **Redis Pub/Sub** sebagai broker pesan (message broker) untuk menerbitkan (*publish*) dan berlangganan (*subscribe*) peristiwa (events) lintas modul.
- Modul pengirim (misal `order`) hanya akan menerbitkan peristiwa ke topik Redis (misal `order.created`) tanpa mengetahui modul mana yang mendengarkannya.
- Modul penerima (misal `billing`) akan berlangganan ke topik tersebut dan mengeksekusi logika bisnisnya secara independen.
- Untuk lingkungan pengembangan lokal, kita memanfaatkan infrastruktur Redis yang sudah terintegrasi dan berjalan di Docker (port 6379).

### Konsekuensi
- **Positif:** Penghapusan ketergantungan langsung antar-modul, memudahkan pembagian kerja tim, dan mempermudah ekstraksi modul menjadi microservices di masa mendatang (cukup mengganti Redis dengan Kafka/RabbitMQ jika diperlukan).
- **Negatif:** debugging alur proses menjadi lebih kompleks karena bersifat asinkron, dan potensi kegagalan transaksi terdistribusi harus ditangani secara hati-hati (misal menggunakan retry mechanism).
- **Risiko:** Perlunya pemantauan koneksi Redis untuk menjamin pengiriman pesan tidak terputus.
