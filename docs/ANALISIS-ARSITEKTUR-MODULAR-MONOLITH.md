# Analisis Arsitektur — Migrasi Modular Monolith dan Event-Driven

**Proyek:** SitusBisnis-migration  
**Stack:** Next.js 16, TypeScript, Prisma, PostgreSQL, Redis, NextAuth, Duitku  
**Tanggal analisis:** 17 Juni 2026 (diperbarui sesi kedua — fokus migrasi API route)  
**Status:** Analisis teknis terhadap struktur modular, layered architecture, event-driven readiness, dan implementasi prematur pada API route.

---

## Ringkasan Eksekutif

Proyek SitusBisnis-migration sudah berada pada arah arsitektur **Modular Monolith** dengan fondasi **Layered Architecture** dan sebagian **Event-Driven Design**. Struktur folder `src/modules/*`, facade per modul via `index.ts`, repository/service/controller separation, serta Dependency Cruiser sudah berjalan dengan baik.

Namun, implementasi event-driven masih belum matang. Event bus sudah ada, Redis Pub/Sub sudah diinisialisasi, dan tabel `EventOutbox` sudah tersedia, tetapi outbox dispatcher, retry mechanism, dead-letter handling, event typing, dan listener coverage masih perlu dilengkapi.

Status terbaik saat ini:

> **Modular Monolith awal dengan event bus sebagian aktif, namun belum sepenuhnya event-driven.**

---

## Verifikasi yang Sudah Dijalankan

| Perintah                    | Hasil                                                 |
| --------------------------- | ----------------------------------------------------- |
| `npm run typecheck`         | Lolos                                                 |
| `npm run test:architecture` | Lolos, Dependency Cruiser tidak menemukan pelanggaran |
| `npm run test:unit`         | Lolos, 177 tests passed                               |

---

## Temuan Utama

### 1. Dokumen arsitektur lebih maju daripada implementasi aktual

Dokumen arsitektur di `docs/id/ARCHITECTURE.md` menyatakan:

- 14 modul domain
- komunikasi via facade dan event bus
- event-driven via Redis Pub/Sub
- outbox pattern
- 22 model Prisma decoupled

Secara struktur, klaim tersebut sebagian benar. Namun implementasi aktual masih campuran antara:

- modular monolith
- layered architecture
- event-driven sebagian
- request/reply sinkron
- facade client sinkron
- beberapa coupling langsung yang masih ada

Rekomendasi: ubah status arsitektur menjadi lebih realistis, misalnya:

> SitusBisnis sedang dalam migrasi menuju Modular Monolith dan Event-Driven Architecture. Fondasi modular dan layered sudah tersedia, sedangkan event-driven masih pada tahap implementasi awal.

---

## Status Modular Monolith

### Sudah Terpenuhi

| Area                                   |         Status | Catatan                                           |
| -------------------------------------- | -------------: | ------------------------------------------------- |
| Struktur folder modular                |          Sudah | `src/modules/*` sudah menjadi batas domain        |
| Facade per modul                       |          Sudah | Setiap modul utama punya `index.ts`               |
| Layering controller/service/repository | Sudah sebagian | Mayoritas modul sudah mengikuti pola              |
| Dependency guard                       |          Sudah | `.dependency-cruiser.json` aktif                  |
| Shared core                            |          Sudah | Event bus, Redis, DB, logger ada di `shared/core` |
| UI per modul                           |          Sudah | Komponen UI ditempatkan di `ui/`                  |
| Listener folder                        |          Sudah | Banyak modul memiliki `listeners/`                |

### Belum Sepenuhnya Terpenuhi

| Area                  | Status | Catatan                                             |
| --------------------- | -----: | --------------------------------------------------- |
| Batas domain absolut  |  Belum | Masih ada direct repository import lintas modul     |
| Event-driven penuh    |  Belum | Banyak komunikasi masih request/reply sinkron       |
| Outbox dispatcher     |  Belum | Tabel ada, tetapi worker umum belum ada             |
| Listener coverage     |  Belum | Beberapa listener masih TODO                        |
| Event contract        |  Belum | `event-types.ts` belum mencakup semua event/request |
| Read model/projection |  Belum | Belum ada pemisahan jelas antara event dan query    |

---

## Modul yang Terdeteksi

Struktur aktif di `src/modules/` mencakup:

| Modul            |         Status | Catatan                                         |
| ---------------- | -------------: | ----------------------------------------------- |
| `auth`           |          Aktif | Identity, user, affiliate, NextAuth integration |
| `catalog`        |          Aktif | Produk dan katalog                              |
| `crud`           |          Aktif | Generic CRUD handler dan cache event            |
| `domain`         |          Aktif | Custom domain dan verifikasi DNS                |
| `financial`      |          Aktif | Coupon, withdrawal, billing context             |
| `infrastructure` | Aktif sebagian | Provisioning dan backup                         |
| `media`          |          Aktif | Media library, gallery, portfolio               |
| `notification`   |          Aktif | Email dan reminder templates                    |
| `order`          |          Aktif | Order dan checkout                              |
| `page`           |          Aktif | CredBuild page, menu, content display           |
| `payment`        |          Aktif | Payment transaction, checkout, Duitku webhook   |
| `post`           |          Aktif | Blog, taxonomy, testimonial, search             |
| `site`           |          Aktif | Site settings, tenant, contact, analytics       |
| `subscription`   |          Aktif | Plan, subscription, limit, expiration           |
| `shared`         |          Aktif | Core utilities, event bus, Redis, DB            |

Catatan: dokumentasi menyebut 14 modul domain. Struktur aktual memiliki 14 modul di bawah `src/modules/`, termasuk `shared` dan `crud`.

---

## Status Layered Architecture

Pola yang digunakan:

```txt
modules/<domain>/
├── index.ts                 # Facade / Client
├── controllers/             # Orkestrasi route/API
├── services/                # Business logic
├── repositories/            # Data access
├── ui/                      # Domain-specific UI
└── listeners/               # Event handlers
```

### Contoh facade yang sudah ada

| Facade               | File                                |
| -------------------- | ----------------------------------- |
| `IdentityClient`     | `src/modules/auth/index.ts`         |
| `CatalogClient`      | `src/modules/catalog/index.ts`      |
| `SiteClient`         | `src/modules/site/index.ts`         |
| `SubscriptionClient` | `src/modules/subscription/index.ts` |
| `PaymentClient`      | `src/modules/payment/index.ts`      |
| `CrudClient`         | `src/modules/crud/index.ts`         |

### Temuan layering

Sebagian besar repository sudah menjadi satu-satunya layer yang menyentuh Prisma. Namun masih ada beberapa area yang perlu dirapikan:

- beberapa service masih membaca Prisma langsung
- beberapa UI masih memanggil event bus request/reply langsung
- beberapa direct import lintas modul masih ada
- beberapa shared utility masih menggunakan alias lama `@/lib/core/db`

---

## Status Event-Driven Architecture

### Komponen yang sudah ada

| Komponen                |         Status | Lokasi                                                |
| ----------------------- | -------------: | ----------------------------------------------------- |
| Event bus               |          Sudah | `src/modules/shared/core/event-bus.ts`                |
| Event types             | Sudah sebagian | `src/modules/shared/core/event-types.ts`              |
| Redis integration       |          Sudah | `src/modules/shared/core/redis.ts`                    |
| Redis Pub/Sub           |          Sudah | `eventBus.init()`                                     |
| Request/reply           |          Sudah | `eventBus.request()` dan `eventBus.reply()`           |
| Outbox table            |          Sudah | Prisma `EventOutbox`                                  |
| Outbox usage            |           Awal | `src/modules/payment/services/transaction.service.ts` |
| Listener initialization |          Sudah | `src/instrumentation.ts`                              |

### Event async yang aktif

| Event                          | Publisher                                                                           | Consumer              |
| ------------------------------ | ----------------------------------------------------------------------------------- | --------------------- |
| `notification.email.send`      | `auth`, `subscription`, `expiration`, `financial`, `site`, `domain`, `notification` | `notification`        |
| `billing.payment.completed`    | `payment` via outbox                                                                | `site`                |
| `affiliate.commission.awarded` | `payment` via outbox                                                                | `auth`                |
| `crud.created`                 | `crud`                                                                              | `crud` cache listener |
| `crud.updated`                 | `crud`                                                                              | `crud` cache listener |
| `crud.deleted`                 | `crud`                                                                              | `crud` cache listener |

### Request/reply yang aktif

| Channel                                 | Provider       | Consumer                                       |
| --------------------------------------- | -------------- | ---------------------------------------------- |
| `request.auth.getSiteOwner`             | `auth`         | payment, subscription, site, domain, financial |
| `request.auth.getUserById`              | `auth`         | financial                                      |
| `request.auth.getUsersMap`              | `auth`         | financial                                      |
| `request.auth.updateUserReferrer`       | `auth`         | payment                                        |
| `request.tenant.getSiteInfo`            | `site`         | payment                                        |
| `request.tenant.verifyUserSiteAccess`   | `site`         | payment, subscription                          |
| `request.tenant.registerDomain`         | `domain`       | auth                                           |
| `request.tenant.removeDomain`           | `domain`       | auth                                           |
| `request.tenant.verifyDomain`           | `domain`       | auth                                           |
| `request.catalog.countProducts`         | `catalog`      | subscription                                   |
| `request.catalog.getProducts`           | `catalog`      | page UI                                        |
| `request.catalog.getProduct`            | `catalog`      | page UI                                        |
| `request.catalog.searchProducts`        | `catalog`      | post search                                    |
| `request.catalog.getProductsMap`        | `catalog`      | order                                          |
| `request.order.countOrders`             | `order`        | subscription                                   |
| `request.content.countPosts`            | `page`         | subscription                                   |
| `request.content.countTestimonials`     | `page`         | subscription                                   |
| `request.content.getMediaSize`          | `page`         | subscription                                   |
| `request.billing.getActiveSubscription` | `subscription` | media                                          |
| `request.billing.checkLimit`            | `subscription` | crud                                           |

Catatan penting: request/reply ini adalah komunikasi sinkron, bukan event-driven async. Ini boleh digunakan untuk query/command, tetapi sebaiknya dibedakan dari domain event.

---

## Listener Coverage

| Modul            | Listener                                        | Status |
| ---------------- | ----------------------------------------------- | -----: |
| `auth`           | `src/modules/auth/listeners/index.ts`           |  Aktif |
| `site`           | `src/modules/site/listeners/index.ts`           |  Aktif |
| `domain`         | `src/modules/domain/listeners/index.ts`         |  Aktif |
| `notification`   | `src/modules/notification/listeners/index.ts`   |  Aktif |
| `subscription`   | `src/modules/subscription/listeners/index.ts`   |  Aktif |
| `page`           | `src/modules/page/listeners/index.ts`           |  Aktif |
| `catalog`        | `src/modules/catalog/listeners/index.ts`        |  Aktif |
| `order`          | `src/modules/order/listeners/index.ts`          |  Aktif |
| `crud`           | `src/modules/crud/listeners/index.ts`           |  Aktif |
| `payment`        | `src/modules/payment/listeners/index.ts`        |   TODO |
| `financial`      | `src/modules/financial/listeners/index.ts`      |   TODO |
| `post`           | `src/modules/post/listeners/index.ts`           |   TODO |
| `media`          | `src/modules/media/listeners/index.ts`          |   TODO |
| `infrastructure` | `src/modules/infrastructure/listeners/index.ts` |   TODO |

---

## Temuan Spesifik: Migrasi API Route

Analisis mendalam terhadap 66 route handler di `src/app/api/` menemukan beberapa pola yang belum selesai dimigrasikan ke arsitektur modular yang benar.

### Inventori Route (66 route)

| Grup               | Jumlah Route |
| ------------------ | ------------ |
| `auth/`            | 12           |
| `payment/billing/` | 12           |
| `media/`           | 9            |
| `post/`            | 8            |
| `order/`           | 6            |
| `site/`            | 5            |
| `page/`            | 5            |
| `subscription/`    | 5            |
| `catalog/`         | 2            |
| `financial/`       | 3            |
| `infrastructure/`  | 2            |
| `domain/`          | 1            |
| `shared/`          | 1            |

### A. Controller Subscription Sebagai Pure Pass-Through (Tidak Ada Nilai Tambah)

**File:** `src/modules/subscription/controllers/subscription.controller.ts`

Controller ini memiliki 28 fungsi yang seluruhnya hanya meneruskan panggilan ke service tanpa logika apapun:

```ts
export async function getPricingPlans() {
  return planService.getPricingPlans(); // tidak ada logika tambahan
}
```

Chain yang terbentuk: `index.ts → controller → service`

Seharusnya cukup: `index.ts → service` atau controller benar-benar punya logika orkestrasi.

**Dampak:** Layer controller yang mubazir menyulitkan penelusuran alur dan menambah file tanpa manfaat.

### B. Business Logic Tebal dan Mutable State di Route Handler

**File:** `src/app/api/page/ai/route.ts` (162 baris)

```ts
// Module-level mutable state di route file — BERBAHAYA di serverless
let rotationIndex = 0;

// Logika resolveAIConfig() 80+ baris langsung di route
async function resolveAIConfig(): Promise<AIConfig | null> { ... }
```

**Masalah ganda:**

1. `rotationIndex` adalah state di level modul. Di lingkungan serverless, setiap cold-start menghasilkan instance baru dengan `rotationIndex = 0`. Rotasi kunci AI tidak akan berfungsi antar request yang berbeda instance.
2. Logika resolusi AI config (JSON parsing, rotation, env fallback) seharusnya ada di service layer modul `page` atau `subscription`.

### C. Orchestration Logic di Route Handler (Bukan di Service Layer)

**File:** `src/app/api/infrastructure/sites/[id]/route.ts` (128 baris)

Route PATCH ini mengambil data dari 3 modul berbeda dan mengatur email notifikasi langsung:

```ts
// 3 Client diimport di route handler
import { SiteClient } from "@/modules/site";
import { FinancialClient } from "@/modules/financial";
import { IdentityClient } from "@/modules/auth";

// Email dikirim langsung dari route via dynamic import
const { sendTrialExtendedEmail } = await import("@/modules/notification");
sendTrialExtendedEmail({...}).catch(...);
```

Orchestration lintas modul seperti ini seharusnya ada di service layer atau use-case layer, bukan di route handler.

### D. Limit Check Subscription di Route Handler (Bukan di Service)

**File:** `src/app/api/order/orders/route.ts`

```ts
// Route handler langsung memanggil SubscriptionClient untuk validasi business
const limitCheck = await SubscriptionClient.checkSiteLimit(siteId, "maxOrders");
if (!limitCheck.allowed) {
  return apiError(limitCheck.message, 403);
}
```

Validasi limit order adalah tanggung jawab modul `order` atau `subscription`, bukan route handler. Route handler seharusnya hanya mendelegasikan ke `OrderClient.createOrder()`, dan OrderClient yang memvalidasi limit secara internal.

### E. Inkonsistensi Format Response — 3 Pola Berbeda

Ditemukan 3 pola response yang digunakan secara tidak konsisten di seluruh API routes:

| Pola                                             | Jumlah Instance | Contoh Route                                |
| ------------------------------------------------ | --------------- | ------------------------------------------- |
| `apiResponse()` / `apiError()` (wrapper standar) | ~20 route       | `site/contact`, `post/*`, `catalog/*`       |
| `NextResponse.json()` langsung                   | 81 instance     | `order/orders/payment`, `payment/billing/*` |
| `new NextResponse("text", {status})`             | Beberapa        | `auth/affiliate/*`, `auth/profile`          |

Inkonsistensi ini membuat API contract tidak seragam dan mempersulit middleware logging/error tracking.

### F. `getServerSession` Duplikat di 26 Route (Tidak Menggunakan `getApiContext`)

Sudah tersedia `getApiContext()` dari `@/lib/api/utils` yang mengabstraksi session + role check, tetapi 26 route masih mengimport langsung:

```ts
// Pola lama yang ditemukan di 26 route:
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const session = await getServerSession(authOptions);

// Pola baru yang sudah tersedia dan seharusnya digunakan:
const { session, error, status } = await getApiContext(["admin"]);
```

Route yang masih memakai pola lama: `auth/affiliate/withdraw`, `auth/bridge`, `auth/onboarding`, `auth/profile`, `auth/user/sites`, `financial/coupons/*`, `financial/withdrawals`, `payment/billing/*` (10+ route).

### G. Modul `notification` Diimport Langsung dari Route (Bukan via Event)

**File:** `src/app/api/subscription/subscriptions/[id]/route.ts`

```ts
import { followupWhatsApp, followupEmail } from "@/modules/notification";
```

Jika event-driven dipakai konsisten, ini seharusnya:

```ts
await eventBus.publish(
  "notification.followup.send",
  { phone, message },
  "subscription",
);
```

### H. Domain Logic di `shared/core/hooks.ts`

**File:** `src/modules/shared/core/hooks.ts`

Bagian bawah file yang seharusnya hanya berisi infrastruktur `HookSystem` juga mengandung logika domain-spesifik:

```ts
// Logika page_data filter dan URL proxying dicampur ke file infrastruktur
hooks.addFilter("page_data", (pageData: any) => {
  // Logika spesifik modul 'page' + 'media'
  if (pageData.imageUrl) {
    pageData.imageUrl = getProxiedUrl(pageData.imageUrl);
  }
  // ...
});
```

Ini seharusnya berada di `modules/page/listeners/` atau `modules/media/listeners/`.

### Peta Prioritas Temuan API Route

| #   | Masalah                                                    | File                                 | Prioritas |
| --- | ---------------------------------------------------------- | ------------------------------------ | --------- |
| 1   | Mutable state `rotationIndex` di route (serverless unsafe) | `page/ai/route.ts`                   | 🔴 Tinggi |
| 2   | Controller subscription pass-through 28 fungsi             | `subscription/controllers/`          | 🔴 Tinggi |
| 3   | Orchestration 3 modul + email di route handler             | `infrastructure/sites/[id]/route.ts` | 🟡 Sedang |
| 4   | Limit check di route, bukan di service                     | `order/orders/route.ts`              | 🟡 Sedang |
| 5   | Tiga pola response berbeda (81 instance raw)               | Banyak route                         | 🟡 Sedang |
| 6   | Business logic 80+ baris di route `page/ai`                | `page/ai/route.ts`                   | 🟡 Sedang |
| 7   | 26 route masih manual `getServerSession`                   | `auth/*`, `payment/*`, `financial/*` | 🟢 Rendah |
| 8   | `notification` diimport langsung dari route                | `subscription/subscriptions/[id]/`   | 🟢 Rendah |
| 9   | Domain logic di `shared/core/hooks.ts`                     | `modules/shared/core/hooks.ts`       | 🟢 Rendah |

---

## Temuan Kritis dan Risiko

### 1. Outbox belum punya dispatcher umum

Tabel `EventOutbox` sudah ada, tetapi belum ada worker umum untuk:

- membaca event `pending`
- mempublish event
- update status ke `published`
- retry event `failed`
- exponential backoff
- dead-letter handling
- idempotency guard
- event processing log
- alerting/monitoring

Saat ini outbox hanya digunakan manual di:

- `src/modules/payment/services/transaction.service.ts`

### 2. Masih ada direct repository import lintas modul

Ditemukan di:

- `src/modules/payment/services/transaction.service.ts`
  - import `subscription.repository`
  - import `coupon.repository`

- `src/modules/financial/services/withdrawal.service.ts`
  - import `subscription/repositories/billing.repository`

Ini diloloskan Dependency Cruiser karena ada pengecualian, tetapi tetap bertentangan dengan prinsip modular monolith ideal.

### 3. Event types belum lengkap

`src/modules/shared/core/event-types.ts` hanya mendefinisikan:

- `user.registered`
- `affiliate.commission.awarded`
- `billing.payment.completed`
- `notification.email.send`

Padahal kode memakai banyak event dan request/reply lain, termasuk:

- `crud.created`
- `crud.updated`
- `crud.deleted`
- `request.tenant.registerDomain`
- `request.tenant.removeDomain`
- `request.tenant.verifyDomain`
- `request.catalog.getProductsMap`
- `request.catalog.countProducts`
- `request.order.countOrders`
- `request.billing.checkLimit`
- `request.billing.getActiveSubscription`

### 4. EventBus belum production-grade

Beberapa kekurangan:

- async handler tidak menunggu hasil
- error handler masih `console.error`
- Redis reconnect strategy belum kuat
- tidak ada DLQ
- tidak ada correlation/causation propagation yang konsisten
- request/reply timeout bisa menggantung jika responder error sebelum publish reply
- publish ke Redis tidak melokal-trigger listener di instance yang sama
- tidak ada tracing/metric
- tidak ada schema validation event payload
- tidak ada event registry

### 5. Request/reply Redis tidak ideal untuk semua query read

Request/reply via Redis cocok untuk command lintas modul, tetapi kurang ideal untuk query read yang membutuhkan latency rendah dan deterministik.

Contoh yang perlu dievaluasi:

- `request.catalog.getProducts`
- `request.catalog.getProduct`
- `request.catalog.getProductsMap`
- `request.auth.getSiteOwner`
- `request.tenant.getSiteInfo`

Untuk read-heavy flow, pertimbangkan:

- facade client
- read model/projection
- cache
- denormalized data
- event-built materialized view

---

## Rekomendasi Prioritas

### Prioritas 1 — Pisahkan Domain Event, Query Request, dan Command Request

Buat kontrak terpisah:

```txt
shared/contracts/
├── events.ts
├── queries.ts
└── commands.ts
```

Contoh:

```ts
type DomainEventMap = {
  "billing.payment.completed": PaymentCompletedEvent;
  "notification.email.send": SendEmailEvent;
  "affiliate.commission.awarded": AffiliateCommissionAwardedEvent;
};

type QueryRequestMap = {
  "request.catalog.getProductsMap": GetProductsMapRequest;
  "request.auth.getSiteOwner": GetSiteOwnerRequest;
};
```

Tujuannya agar event-driven tidak dicampur dengan request/reply sinkron.

---

### Prioritas 2 — Bangun Outbox Dispatcher Umum

Tambahkan dispatcher di `shared/core/outbox-dispatcher` atau `shared/core/event-outbox`.

Fitur minimal:

- ambil event `pending`
- publish ke event bus
- update status ke `published`
- retry event `failed`
- exponential backoff
- max retry
- dead-letter/error log
- idempotency key
- structured logging

Target API:

```ts
await outboxDispatcher.processPendingEvents();
```

Jalankan melalui:

- cron route
- worker process
- scheduler
- Next.js instrumentation startup
- atau background job terpisah

---

### Prioritas 3 — Kurangi Direct Repository Import Lintas Modul

Prioritas perbaikan:

- `src/modules/payment/services/transaction.service.ts`
- `src/modules/financial/services/withdrawal.service.ts`

Alternatif yang disarankan:

1. gunakan facade client
2. gunakan command/event
3. gunakan saga/process manager
4. gunakan shared unit-of-work jika transaksi benar-benar wajib atomik

Jika exception tetap diperlukan, dokumentasikan sebagai intentional exception dan batasi jumlahnya.

---

### Prioritas 4 — Lengkapi Listener yang Masih TODO

Isi listener untuk:

- `payment`
- `financial`
- `post`
- `media`
- `infrastructure`

Contoh event yang cocok:

| Event                          | Konsumen                                                    |
| ------------------------------ | ----------------------------------------------------------- |
| `billing.payment.completed`    | subscription activation, affiliate commission, notification |
| `affiliate.commission.awarded` | financial balance update                                    |
| `tenant.site.created`          | provisioning, welcome notification                          |
| `content.published`            | search indexing, sitemap refresh                            |
| `media.uploaded`               | optimization, quota update                                  |

---

### Prioritas 5 — Perbaiki Production Readiness EventBus

Tambahkan:

- event registry
- payload validation
- correlation/causation propagation
- retry policy
- dead-letter queue
- metrics
- tracing
- graceful shutdown
- local trigger fallback saat Redis publish berhasil
- structured logging
- alerting untuk failed publish/dispatch

---

## Rekomendasi Struktur Target

```txt
src/
├── app/
├── modules/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── listeners/
│   │   └── ui/
│   ├── billing/
│   ├── catalog/
│   ├── content/
│   ├── order/
│   ├── payment/
│   ├── subscription/
│   ├── financial/
│   ├── notification/
│   ├── tenant/
│   └── shared/
│       ├── core/
│       │   ├── event-bus.ts
│       │   ├── event-types.ts
│       │   ├── outbox-dispatcher.ts
│       │   ├── db.ts
│       │   └── redis.ts
│       └── contracts/
│           ├── events.ts
│           ├── queries.ts
│           └── commands.ts
```

Catatan: struktur target di atas adalah rekomendasi evolusi. Jangan mengubah struktur secara besar-besaran tanpa roadmap migrasi bertahap.

---

## Status ADR

### ADR-008 — Modular Monolith dengan Skema Database Decoupled

Status rekomendasi: **Accepted - Initial Implementation**

Alasan:

- struktur modular sudah ada
- facade sudah ada
- dependency guard sudah aktif
- database sudah lebih decoupled dibanding sebelumnya

Namun masih ada relasi Prisma lintas agregat yang perlu dikaji ulang, terutama:

- `PaymentTransaction -> Plan`
- `PaymentTransaction -> Coupon`
- `Subscription -> Plan`
- `Term -> Post/Product/Page`
- `MetaData -> Post/Page/Product`

Relasi dalam modul masih dapat diterima. Relasi lintas modul sebaiknya dihindari atau didokumentasikan sebagai intentional coupling.

### ADR-009 — Event-Driven Design via Redis Pub/Sub

Status rekomendasi: **Accepted - Initial Implementation**

Alasan:

- Redis Pub/Sub sudah tersedia
- event bus sudah berjalan
- outbox table sudah ada
- beberapa listener aktif

Namun belum cukup untuk disebut event-driven architecture matang karena:

- outbox dispatcher belum lengkap
- request/reply masih dominan
- event typing belum lengkap
- listener coverage belum lengkap
- retry/DLQ/idempotency belum ada

---

## Roadmap Implementasi

### Fase 0 — Bersihkan API Route Layer (Migrasi Prematur)

Sebelum pekerjaan event-driven dilanjutkan, pola-pola prematur di route handler perlu dibenahi:

- **pindahkan `resolveAIConfig()` dan `rotationIndex`** dari `page/ai/route.ts` ke service layer (`modules/page/services/ai-config.service.ts`)
- **hapus controller subscription** yang hanya pass-through — sambungkan `SubscriptionClient` langsung ke service
- **pindahkan orchestration** di `infrastructure/sites/[id]/route.ts` ke `InfrastructureClient` atau dedicated use-case service
- **pindahkan limit check** dari `order/orders/route.ts` ke dalam `OrderClient.createOrder()`
- **standardisasi response format** — semua route harus menggunakan `apiResponse()` / `apiError()` dari `@/lib/api/utils`
- **ganti `getServerSession` duplikat** di 26 route dengan `getApiContext()` yang sudah tersedia
- **pindahkan `page_data` filter** dari `shared/core/hooks.ts` ke `page/listeners/` atau `media/listeners/`

### Fase 1 — Stabilkan Modular Monolith

- rapikan alias DB dari `@/lib/core/db` ke `@/modules/shared/core/db`
- pastikan semua repository berada di modul masing-masing
- kurangi direct import internal lintas modul
- dokumentasikan exception yang disengaja
- tambahkan arsitektur test untuk direct repository import

### Fase 2 — Matangkan Event Contracts

- pisahkan domain event, query request, command request
- lengkapi `EventMap`
- validasi payload event dengan Zod
- buat event registry
- tambahkan dokumentasi event per modul

### Fase 3 — Implementasi Outbox Dispatcher

- buat dispatcher umum
- tambahkan retry dan backoff
- tambahkan dead-letter handling
- tambahkan idempotency key
- tambahkan structured logging
- jalankan dispatcher via cron/worker

### Fase 4 — Kurangi Request/Reply Sinkron

- identifikasi request/reply yang hanya untuk read
- ubah menjadi facade client atau read model
- gunakan request/reply hanya untuk command lintas modul yang memang butuh response
- tambahkan timeout dan circuit breaker untuk request/reply

### Fase 5 — Lengkapi Listener Modul

- implementasi listener untuk modul TODO (`payment`, `financial`, `post`, `media`, `infrastructure`)
- tambahkan test integration untuk event flow
- tambahkan observability untuk event processing

---

## Kesimpulan

Proyek SitusBisnis-migration sudah memiliki fondasi yang baik untuk migrasi ke Modular Monolith dan Event-Driven Architecture. Struktur modular, facade, layering, Dependency Cruiser, event bus, dan outbox table sudah ada.

Namun, analisis sesi kedua (fokus migrasi API route) menemukan bahwa **route layer masih menyimpan sejumlah implementasi prematur** yang perlu dibersihkan sebelum pekerjaan event-driven dilanjutkan. Dua masalah paling mendesak:

1. **Mutable module-level state** (`rotationIndex`) di `page/ai/route.ts` — berisiko silent bug di serverless
2. **Controller subscription** dengan 28 fungsi pass-through — layer yang tidak menambah nilai

Urutan fokus yang disarankan:

1. bersihkan API route layer dari pola prematur (Fase 0)
2. stabilkan batas modul dan kurangi direct import lintas modul
3. membangun outbox dispatcher umum
4. melengkapi event contract dan typing
5. mengisi listener yang masih TODO
6. membedakan dengan tegas antara domain event dan request/reply sinkron

Dengan langkah tersebut, proyek akan bergerak dari kondisi saat ini:

> **modular monolith awal dengan event bus sebagian aktif dan route layer yang belum sepenuhnya dimigrasikan**

menuju:

> **modular monolith yang bersih, route sebagai thin handler, event-driven, observable, dan siap diekstrak ke layanan terpisah jika diperlukan di masa depan.**
