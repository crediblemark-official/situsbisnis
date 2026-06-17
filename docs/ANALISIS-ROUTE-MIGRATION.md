# Analisis Migrasi API Route — SitusBisnis-migration

**Tanggal:** 17 Juni 2026
**Proyek:** SitusBisnis-migration (Next.js 16, Modular Monolith, Layered Architecture, Event-Driven)
**Fokus:** Inventori API route, identifikasi implementasi prematur, dan rencana migrasi ke module

---

## 1. Ringkasan Eksekutif

Proyek SitusBisnis-migration sudah memiliki fondasi Modular Monolith yang baik dengan:

- **16 modul** di `src/modules/*`
- **Facade/Client** per modul via `index.ts`
- **Dependency Cruiser** untuk menjaga batas modul
- **Event Bus** dengan Redis Pub/Sub
- **7 file Server Actions** siap pakai

Namun, **layer API route (53 file)** masih mengandung implementasi prematur:

| Masalah                                           | Jumlah                           | Severitas |
| ------------------------------------------------- | -------------------------------- | --------- |
| Route masih pakai `getServerSession(authOptions)` | **7 terkonfirmasi** (10+ diduga) | 🔴 Tinggi |
| Response format tidak konsisten                   | **3 pola berbeda**               | 🔴 Tinggi |
| Rewrite rules legacy (dua URL per route)          | **33 rule**                      | 🟡 Sedang |
| Alias `@/lib/*` masih dipakai 239+ kali           | -                                | 🟡 Sedang |
| Orchestration bisnis di route handler             | Beberapa route                   | 🟡 Sedang |

---

## 2. Inventori Lengkap API Routes (53 file)

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts
│   ├── bridge/route.ts
│   └── bridge/accept/route.ts
├── domain/
│   └── domains/
│       └── verify/route.ts
├── financial/
│   ├── coupons/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── withdrawals/
│       └── update/route.ts
├── infrastructure/
│   ├── backup/route.ts
│   └── sites/[id]/route.ts
├── media/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── folders/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── gallery/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── portfolios/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── proxy/route.ts
├── order/
│   └── orders/
│       ├── route.ts
│       ├── [id]/route.ts
│       ├── check-status/route.ts
│       ├── payment/route.ts
│       ├── payment-methods/route.ts
│       └── webhook/duitku/route.ts
├── page/
│   ├── ai/route.ts
│   ├── credbuild/route.ts
│   └── menus/
│       ├── route.ts
│       └── [id]/route.ts
├── payment/
│   ├── billing/
│   │   ├── buy-slot/route.ts
│   │   ├── cancel/route.ts
│   │   ├── check-status/route.ts
│   │   ├── checkout/payment/route.ts
│   │   ├── confirm/route.ts
│   │   ├── extend-trial/route.ts
│   │   ├── payment-methods/route.ts
│   │   ├── simulate-duitku/route.ts
│   │   ├── upgrade/route.ts
│   │   ├── validate-coupon/route.ts
│   │   └── webhook/duitku/route.ts
│   └── transactions/
│       └── update/route.ts
├── post/
│   ├── search/route.ts
│   └── testimonials/route.ts
├── shared/
│   └── openapi/route.ts
├── site/
│   ├── analytics/route.ts
│   ├── contact/route.ts
│   ├── health/route.ts
│   └── settings/
│       ├── route.ts
│       ├── payments/route.ts
│       └── validate/route.ts
└── subscription/
    ├── cron/check-subscriptions/route.ts
    ├── plans/route.ts
    ├── settings/
    │   ├── route.ts
    │   └── ai-models/route.ts
    └── subscriptions/[id]/route.ts
```

**Total: 53 file route.ts**

---

## 3. Klasifikasi Route

### A. SUDAH TERMIGRASI — Thin Adapters (24 Route)

Route berikut sudah menggunakan pola yang benar: mendelegasikan ke Module Client dengan `getApiContext()`:

| Route                                     | Module Client                         | Response                 |
| ----------------------------------------- | ------------------------------------- | ------------------------ |
| `media/route.ts`                          | `MediaClient`                         | ✅ `apiResponse()`       |
| `media/[id]/route.ts`                     | `MediaClient`                         | ✅ `apiResponse()`       |
| `media/folders/route.ts`                  | `MediaClient`                         | ✅ `apiResponse()`       |
| `media/folders/[id]/route.ts`             | `MediaClient`                         | ✅ `apiResponse()`       |
| `media/gallery/route.ts`                  | `media/api/galleryApi`                | ✅ Delegated             |
| `media/portfolios/route.ts`               | `media/api/portfolioApi`              | ✅ Delegated             |
| `media/proxy/route.ts`                    | (Image proxy standalone)              | ✅ Wajib API             |
| `site/settings/route.ts`                  | `SiteClient` + `FinancialClient`      | ✅ `apiResponse()`       |
| `site/settings/validate/route.ts`         | (GTM validation)                      | ✅ Standalone            |
| `site/settings/payments/route.ts`         | `getPaymentSettings`                  | ✅ `apiResponse()`       |
| `site/contact/route.ts`                   | `SiteClient`                          | ✅ `apiResponse()`       |
| `site/analytics/route.ts`                 | `SiteClient`                          | ✅ `apiResponse()`       |
| `site/health/route.ts`                    | `SiteClient` + `SubscriptionClient`   | ✅ `NextResponse.json()` |
| `page/menus/route.ts`                     | `PageClient`                          | ✅ `apiResponse()`       |
| `page/menus/[id]/route.ts`                | `PageClient`                          | ✅ `apiResponse()`       |
| `page/credbuild/route.ts`                 | `PageClient`                          | ✅ `apiResponse()`       |
| `order/orders/route.ts`                   | `OrderClient`                         | ✅ `apiResponse()`       |
| `order/orders/[id]/route.ts`              | `OrderClient`                         | ✅ `apiResponse()`       |
| `order/orders/webhook/duitku/route.ts`    | `OrderClient`                         | ✅ Wajib API             |
| `auth/bridge/accept/route.ts`             | `IdentityClient`                      | ✅ Wajib API             |
| `payment/billing/webhook/duitku/route.ts` | `PaymentClient`                       | ✅ Wajib API             |
| `infrastructure/backup/route.ts`          | `InfrastructureClient`                | ✅ `apiResponse()`       |
| `infrastructure/sites/[id]/route.ts`      | `SiteClient` + `InfrastructureClient` | ✅ `apiResponse()`       |
| `domain/domains/verify/route.ts`          | `DomainClient`                        | ✅ `apiResponse()`       |
| `subscription/plans/route.ts`             | `SubscriptionClient`                  | ✅ `apiResponse()`       |
| `subscription/settings/route.ts`          | `SubscriptionClient`                  | ✅ `apiResponse()`       |
| `payment/billing/extend-trial/route.ts`   | `SubscriptionClient`                  | ✅ `apiResponse()`       |

---

### B. PREMATURE — Masih Pakai `getServerSession(authOptions)` (7 Route TERKONFIRMASI)

Route berikut masih menggunakan pola auth **LAMA** yang berbahaya — tanpa role checking, site validation, atau subscription check:

**Pattern LAMA (yang masih dipakai):**

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const session = await getServerSession(authOptions);
if (!session) return new NextResponse("Unauthorized", { status: 401 });
// ❌ Tidak ada role check
// ❌ Tidak ada site context
// ❌ Tidak ada subscription check
// ❌ CSRF manual
// ❌ NextResponse.json() langsung
```

**Daftar Route:**

| #   | Route                                   | File                                        | Auth                  | Response                 | CSRF   |
| --- | --------------------------------------- | ------------------------------------------- | --------------------- | ------------------------ | ------ |
| 1   | `/api/payment/billing/buy-slot`         | `payment/billing/buy-slot/route.ts`         | ❌ `getServerSession` | ❌ `NextResponse.json()` | Manual |
| 2   | `/api/payment/billing/cancel`           | `payment/billing/cancel/route.ts`           | ❌ `getServerSession` | ❌ `NextResponse.json()` | Manual |
| 3   | `/api/payment/billing/checkout/payment` | `payment/billing/checkout/payment/route.ts` | ❌ `getServerSession` | ❌ `NextResponse.json()` | Manual |
| 4   | `/api/payment/billing/upgrade`          | `payment/billing/upgrade/route.ts`          | ❌ `getServerSession` | ❌ `NextResponse.json()` | Manual |
| 5   | `/api/payment/billing/validate-coupon`  | `payment/billing/validate-coupon/route.ts`  | ❌ `getServerSession` | ❌ `NextResponse.json()` | Manual |
| 6   | `/api/payment/billing/confirm`          | `payment/billing/confirm/route.ts`          | ❌ `getServerSession` | ❌ `NextResponse.json()` | Manual |
| 7   | `/api/payment/billing/payment-methods`  | `payment/billing/payment-methods/route.ts`  | ❌ `getServerSession` | ❌ `NextResponse.json()` | -      |

**Pattern Target (yang HARUSnya):**

```typescript
import { getApiContext, apiResponse, apiError } from "@/lib/api/utils";
import { PaymentClient } from "@/modules/payment";

export async function POST(req: Request) {
  try {
    const { session, error, status } = await getApiContext(["owner", "admin"]);
    if (error) return apiError(error, status);

    const result = await PaymentClient.buySlot(session.user.id, ...);
    return apiResponse(result);
  } catch (error: any) {
    if (error.message === "Forbidden") return apiError("Forbidden", 403);
    if (error.message === "Not Found") return apiError("Not Found", 404);
    return apiError("Internal Error");
  }
}
```

---

### C. DIDUGA PREMATURE — Perlu Verifikasi

Route berikut **diduga** masih menggunakan pola lama karena berada di grup yang sama dengan route terkonfirmasi:

| Route                                            | Dugaan                     |
| ------------------------------------------------ | -------------------------- |
| `payment/billing/simulate-duitku/route.ts`       | Mungkin `getServerSession` |
| `payment/billing/check-status/route.ts`          | Mungkin `getServerSession` |
| `payment/transactions/update/route.ts`           | Mungkin pola lama          |
| `financial/coupons/route.ts`                     | Mungkin `getServerSession` |
| `financial/coupons/[id]/route.ts`                | Mungkin `getServerSession` |
| `financial/withdrawals/update/route.ts`          | Mungkin `getServerSession` |
| `subscription/settings/ai-models/route.ts`       | Perlu dicek                |
| `subscription/subscriptions/[id]/route.ts`       | Perlu dicek                |
| `order/orders/check-status/route.ts`             | Perlu dicek                |
| `order/orders/payment/route.ts`                  | Perlu dicek                |
| `order/orders/payment-methods/route.ts`          | Perlu dicek                |
| `post/testimonials/route.ts`                     | Perlu dicek                |
| `post/search/route.ts`                           | Perlu dicek                |
| `shared/openapi/route.ts`                        | Perlu dicek                |
| `subscription/cron/check-subscriptions/route.ts` | Perlu dicek                |
| `page/ai/route.ts`                               | Perlu dicek                |
| `media/gallery/[id]/route.ts`                    | Perlu dicek                |
| `media/portfolios/[id]/route.ts`                 | Perlu dicek                |

---

### D. WAJIB TETAP API (~14 Route)

Route berikut tidak bisa dihilangkan karena kebutuhan teknis:

| Route                                            | Alasan                    |
| ------------------------------------------------ | ------------------------- |
| `auth/[...nextauth]/route.ts`                    | NextAuth OAuth callback   |
| `auth/bridge/route.ts`                           | Cross-domain SSO redirect |
| `auth/bridge/accept/route.ts`                    | Cross-domain SSO accept   |
| `media/proxy/route.ts`                           | Image proxy + Sharp       |
| `media/route.ts` (POST)                          | File upload multipart     |
| `order/orders/route.ts` (POST)                   | Checkout publik (visitor) |
| `order/orders/check-status/route.ts`             | Polling checkout publik   |
| `order/orders/payment/route.ts`                  | Butuh `req.headers`       |
| `order/orders/payment-methods/route.ts`          | Checkout publik           |
| `order/orders/webhook/duitku/route.ts`           | Webhook Duitku            |
| `payment/billing/webhook/duitku/route.ts`        | Webhook Duitku            |
| `post/testimonials/route.ts` (POST)              | Submit testimonial publik |
| `site/contact/route.ts` (POST)                   | Form kontak publik        |
| `site/health/route.ts`                           | Health check              |
| `shared/openapi/route.ts`                        | OpenAPI spec              |
| `subscription/cron/check-subscriptions/route.ts` | Cron eksternal            |

---

## 4. Masalah Inkonsistensi Response Format

Ditemukan **3 pola response** tidak konsisten:

| Pola                                    | Penggunaan | Contoh Route        |
| --------------------------------------- | ---------- | ------------------- |
| ✅ `apiResponse()` / `apiError()`       | ~30 route  | `site/*`, `media/*` |
| ❌ `NextResponse.json()` langsung       | ~15+ route | `payment/billing/*` |
| ❌ `new NextResponse("text", {status})` | Beberapa   | webhook             |

**Dampak:** API contract tidak seragam, error handling berbeda, sulit middleware logging.

---

## 5. Legacy Rewrite Rules (33 Rule)

`next.config.js` memiliki **33 rewrite rule** — setiap route punya **dua URL publik**:

```js
// Contoh rewrite
{ source: '/api/billing/:path*', destination: '/api/payment/billing/:path*' },
{ source: '/api/orders/:path*', destination: '/api/order/orders/:path*' },
{ source: '/api/settings/:path*', destination: '/api/site/settings/:path*' },
// ... 30 rule lainnya
```

**Masalah:** Dua URL publik, tidak ada deprecation, risiko silent 404.

---

## 6. Alias `@/lib/*` Legacy (239+ Referensi)

```json
"@/lib/*": ["./src/modules/shared/utils/*"],
"@/lib/core/*": ["./src/modules/shared/core/*"]
```

| Alias                    | File Fisik                         | Referensi |
| ------------------------ | ---------------------------------- | --------- |
| `@/lib/auth`             | `shared/utils/auth/index.ts`       | ~30+      |
| `@/lib/core/db`          | `shared/core/db.ts`                | ~40+      |
| `@/lib/api/utils`        | `shared/utils/api/utils.ts`        | ~50+      |
| `@/lib/domains/tenant`   | `shared/utils/domains/tenant.ts`   | ~30+      |
| `@/lib/settings/payment` | `shared/utils/settings/payment.ts` | ~15+      |
| `@/lib/billing/currency` | `shared/utils/billing/currency.ts` | ~10+      |
| Lainnya                  | -                                  | ~60+      |

---

## 7. Master Plan Migrasi

### Tahap 1 — Standardisasi Route payment/billing/\* (PRIORITAS TERTINGGI)

**7 route** di `payment/billing/` yang masih pakai pola lama:

| Route                       | Perubahan                                          |
| --------------------------- | -------------------------------------------------- |
| `buy-slot/route.ts`         | Auth → `getApiContext`, Response → `apiResponse()` |
| `cancel/route.ts`           | Sama                                               |
| `checkout/payment/route.ts` | Sama                                               |
| `upgrade/route.ts`          | Sama                                               |
| `validate-coupon/route.ts`  | Sama                                               |
| `confirm/route.ts`          | Sama                                               |
| `payment-methods/route.ts`  | Sama                                               |

### Tahap 2 — Standardisasi Response Format

Ubah semua `NextResponse.json()` langsung menjadi `apiResponse()`/`apiError()`.

### Tahap 3 — Hapus Rewrite Rules Bertahap

1. Tandai deprecated di `next.config.js`
2. Perbarui client dashboard/site ke URL baru
3. Hapus rewrite rules

### Tahap 4 — Migrasi Mutasi ke Server Actions

Server Actions sudah ada di 7 modul dan siap digunakan.

### Tahap 5 — Migrasi GET ke Server Component

```tsx
// SEBELUM: Client Component + fetch
"use client";
useEffect(() => {
  fetch("/api/pages")
    .then((r) => r.json())
    .then(setPages);
}, []);

// SESUDAH: Server Component langsung panggil Module Client
import { PageClient } from "@/modules/page";
const pages = await PageClient.getPages(siteId);
return <PageList pages={pages} />;
```

---

## 8. Prioritas Eksekusi

| Prioritas | Task                                 | Dampak                          |
| --------- | ------------------------------------ | ------------------------------- |
| P1        | Migrasi 7 route payment/billing/\*   | Fix auth bypass + standardisasi |
| P1        | Standardisasi response format        | API contract konsisten          |
| P2        | Tandai rewrite deprecated            | Kurangi technical debt          |
| P2        | Perbarui client ke URL baru          | Persiapan hapus rewrite         |
| P3        | Verifikasi 18 route diduga premature | Identifikasi lengkap            |
| P3        | Migrasi GET ke Server Component      | Kurangi beban API               |
| P3        | Migrasi mutasi ke Server Actions     | Kurangi surface API             |

---

## 9. Rute Target Akhir (~14-18 Route)

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts       ← NextAuth OAuth
│   ├── bridge/route.ts              ← SSO redirect
│   └── bridge/accept/route.ts       ← SSO accept
├── media/
│   ├── proxy/route.ts               ← Image proxy
│   └── route.ts (POST)              ← Upload multipart
├── order/orders/
│   ├── route.ts (POST)              ← Checkout publik
│   ├── check-status/route.ts        ← Polling
│   ├── payment/route.ts             ← Init payment
│   ├── payment-methods/route.ts     ← Checkout publik
│   └── webhook/duitku/route.ts      ← Webhook Duitku
├── payment/billing/
│   └── webhook/duitku/route.ts      ← Webhook Duitku
├── post/
│   └── testimonials/route.ts (POST) ← Testimonial publik
├── site/
│   ├── contact/route.ts (POST)      ← Form kontak
│   └── health/route.ts              ← Health check
├── shared/openapi/route.ts          ← OpenAPI spec
└── subscription/cron/check-subscriptions/route.ts ← Cron
```

**Dari 53 → ~14-18 route. Reduksi ~65-73%.**

---

## Lampiran: File Server Actions yang Sudah Ada

```typescript
// 1. auth/actions/auth.actions.ts — updateSiteCustomDomain, verifySiteCustomDomain, registerUser
// 2. catalog/actions/product.actions.ts — createProduct, updateProduct, deleteProduct
// 3. media/actions/media.actions.ts — createGalleryItem, deleteGalleryItem, createPortfolioItem, deletePortfolioItem
// 4. page/actions/page.actions.ts — createPage, updatePage, deletePage
// 5. payment/actions/payment.actions.ts — createTransaction
// 6. post/actions/post.actions.ts — createPost, updatePost, deletePost, createTaxonomy, updateTaxonomy, deleteTaxonomy, createTestimonial, deleteTestimonial
// 7. site/actions/site.actions.ts — updateSite
```

---

_Dokumen digenerate berdasarkan analisis kode langsung pada 17 Juni 2026._
