# Analisis: Dapatkah API Route Dihilangkan?

**Proyek:** SitusBisnis-migration  
**Tanggal:** 17 Juni 2026  
**Pertanyaan:** Apakah seluruh atau sebagian `src/app/api/` bisa dihapus dan diganti mekanisme lain?

---

## Temuan Kritis: Dua Lapisan URL yang Hidup Berdampingan

Sebelum menjawab pertanyaan utama, temuan ini adalah yang paling penting:

### Masalah: API route punya dua URL yang mengarah ke file yang sama

Saat ini ada **33 rewrite rule** di `next.config.js` yang membuat setiap route punya **dua URL publik** sekaligus:

| URL Lama (Client Memanggil)  | URL Baru (File Aktual)              |
| ---------------------------- | ----------------------------------- |
| `/api/orders`                | `/api/order/orders`                 |
| `/api/billing/*`             | `/api/payment/billing/*`            |
| `/api/pages`                 | `/api/page/pages`                   |
| `/api/settings`              | `/api/site/settings`                |
| `/api/users`                 | `/api/auth/users`                   |
| `/api/posts`                 | `/api/post/posts`                   |
| `/api/taxonomies`            | `/api/post/taxonomies`              |
| `/api/gallery`               | `/api/media/gallery`                |
| `/api/admin/subscriptions/*` | `/api/subscription/subscriptions/*` |
| ... (33 total)               | ...                                 |

**Ini adalah technical debt nyata:** client (dashboard, site) masih memanggil URL lama, sementara file route sudah dipindahkan ke path baru yang mengikuti struktur modul. Kedua URL hidup berdampingan via Next.js rewrites.

**Akibatnya:**

- Tidak ada backward compatibility yang terkontrol — siapa pun bisa memanggil kedua URL
- URL lama tidak terdokumentasi sebagai "deprecated"
- Tidak ada timeline untuk menghapus URL lama
- Risiko breaking change jika rewrite dihapus sebelum semua client diperbarui

---

## Klasifikasi 74 Route: Mana yang Bisa Dihapus?

### Kategori A: WAJIB tetap jadi API Route (tidak bisa diganti)

| Route                                            | Alasan                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `auth/[...nextauth]/route.ts`                    | NextAuth memerlukan endpoint HTTP untuk callback OAuth dan session                         |
| `payment/billing/webhook/duitku/route.ts`        | Duitku memanggil endpoint ini dari server eksternal                                        |
| `order/orders/webhook/duitku/route.ts`           | Idem                                                                                       |
| `subscription/cron/check-subscriptions/route.ts` | Cron job eksternal (cron-job.org/Vercel Cron) memanggil via HTTP GET                       |
| `auth/bridge/route.ts`                           | Cross-domain redirect — diakses via browser redirect antar domain berbeda                  |
| `auth/bridge/accept/route.ts`                    | Idem                                                                                       |
| `media/proxy/route.ts`                           | Streaming binary (gambar + Sharp transform) — tidak bisa jadi Server Action                |
| `media/route.ts` (POST)                          | File upload multipart — Server Action tidak mendukung streaming upload yang sama           |
| `media/[id]/route.ts` (DELETE)                   | Terkait file delete + R2 storage                                                           |
| `order/orders/route.ts` (POST)                   | Dipanggil dari checkout **site publik** (`(site)/checkout/page.tsx`) — visitor tidak login |
| `post/testimonials/route.ts` (POST)              | Dipanggil dari `(site)/submit-testimonial/page.tsx` — visitor tidak login                  |
| `order/orders/payment/route.ts`                  | Mengakses `req.headers.get("host")` untuk build origin URL — context HTTP required         |
| `order/orders/check-status/route.ts`             | Dipanggil dari komponen `ShopCheckoutPayment.tsx` di site publik                           |
| `order/orders/payment-methods/route.ts`          | Dipanggil dari komponen checkout site publik                                               |

**Total wajib: ~14 route**

---

### Kategori B: BISA diganti Server Actions (dashboard-only mutation)

Route yang hanya dipanggil dari client component dashboard/admin dan melakukan **mutasi** (POST/PUT/PATCH/DELETE):

| URL Lama                                | File Route                                         | Kandidat Server Action                      |
| --------------------------------------- | -------------------------------------------------- | ------------------------------------------- |
| `/api/profile` (PUT)                    | `auth/profile/route.ts`                            | `updateProfileAction()`                     |
| `/api/auth/register` (POST)             | `auth/register/route.ts`                           | `registerUserAction()`                      |
| `/api/user/sites` (POST/DELETE)         | `auth/user/sites/route.ts`                         | `createSiteAction()` / `deleteSiteAction()` |
| `/api/user/sites/verify` (POST)         | `auth/user/sites/verify/route.ts`                  | `verifyDomainAction()`                      |
| `/api/onboarding` (POST)                | `auth/onboarding/route.ts`                         | `completeOnboardingAction()`                |
| `/api/affiliate/withdraw` (POST)        | `auth/affiliate/withdraw/route.ts`                 | `requestWithdrawalAction()`                 |
| `/api/pages` (POST/PUT)                 | `page/pages/route.ts` + `page/pages/[id]/route.ts` | `createPageAction()` / `updatePageAction()` |
| `/api/menus` (POST/PUT)                 | `page/menus/route.ts` + `page/menus/[id]/route.ts` | `saveMenuAction()`                          |
| `/api/posts` (POST/PUT)                 | `post/posts/route.ts` + `post/posts/[id]/route.ts` | `createPostAction()` / `updatePostAction()` |
| `/api/taxonomies` (POST/PUT)            | `post/taxonomies/route.ts` + terms routes          | `saveTaxonomyAction()`                      |
| `/api/gallery` (POST)                   | `media/gallery/route.ts` + `[id]/route.ts`         | `saveGalleryAction()`                       |
| `/api/portfolios` (POST/PUT)            | `media/portfolios/route.ts` + `[id]/route.ts`      | `savePortfolioAction()`                     |
| `/api/settings` (PATCH)                 | `site/settings/route.ts`                           | `updateSettingsAction()`                    |
| `/api/settings/payments` (PATCH)        | `site/settings/payments/route.ts`                  | `updatePaymentSettingsAction()`             |
| `/api/billing/cancel` (POST)            | `payment/billing/cancel/route.ts`                  | `cancelSubscriptionAction()`                |
| `/api/billing/extend-trial` (POST)      | `payment/billing/extend-trial/route.ts`            | `extendTrialAction()`                       |
| `/api/billing/upgrade` (POST)           | `payment/billing/upgrade/route.ts`                 | `upgradeSubscriptionAction()`               |
| `/api/billing/buy-slot` (POST)          | `payment/billing/buy-slot/route.ts`                | `buySlotAction()`                           |
| `/api/billing/simulate-duitku` (POST)   | `payment/billing/simulate-duitku/route.ts`         | `simulateDuitkuAction()`                    |
| `/api/billing/confirm` (POST)           | `payment/billing/confirm/route.ts`                 | `confirmTransactionAction()`                |
| `/api/admin/backup` (POST)              | `infrastructure/backup/route.ts`                   | `createBackupAction()`                      |
| `/api/admin/sites/[id]` (DELETE/PATCH)  | `infrastructure/sites/[id]/route.ts`               | `deleteSiteAction()` / `manageSiteAction()` |
| `/api/admin/withdrawals/update` (PATCH) | `financial/withdrawals/update/route.ts`            | `processWithdrawalAction()`                 |
| `/api/admin/plans` (PATCH)              | `subscription/settings/route.ts`                   | `updatePlatformSettingsAction()`            |
| `/api/admin/subscriptions/[id]` (PATCH) | `subscription/subscriptions/[id]/route.ts`         | `manageSubscriptionAction()`                |
| `/api/admin/settings/ai-models` (POST)  | `subscription/settings/ai-models/route.ts`         | `fetchAIModelsAction()`                     |
| `/api/products` (POST/PUT)              | `catalog/products/route.ts` + `[id]/route.ts`      | `saveProductAction()`                       |
| `/api/orders/[id]` (PATCH)              | `order/orders/[id]/route.ts`                       | `updateOrderStatusAction()`                 |

**Total kandidat Server Actions: ~28 route**

---

### Kategori C: BISA diganti fetch server-side (GET yang hanya dibaca di server)

Route yang hanya melakukan GET dan dipanggil dari client component dashboard untuk membaca data — ini bisa diganti dengan `fetch()` di Server Component atau `loader` pattern:

| URL                                  | Kandidat Pengganti                                                          |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `/api/pages` (GET)                   | Server Component fetch langsung ke `PageClient.getPages()`                  |
| `/api/posts` (GET)                   | Server Component fetch langsung ke `PostClient.getPosts()`                  |
| `/api/taxonomies` (GET)              | Server Component fetch langsung ke `PostClient.getTaxonomies()`             |
| `/api/products` (GET)                | Server Component fetch langsung ke `CatalogClient.getProducts()`            |
| `/api/user/sites` (GET)              | Server Component fetch langsung ke `IdentityClient.getUserSites()`          |
| `/api/settings` (GET)                | Server Component fetch langsung ke `SiteClient.getSiteSettings()`           |
| `/api/affiliate/check` (GET)         | Server Component atau redirect to Server Action                             |
| `/api/media` (GET)                   | Bisa jadi Server Component jika client tidak perlu refetch                  |
| `/api/media/folders` (GET)           | Idem                                                                        |
| `/api/billing/payment-methods` (GET) | Bisa jadi Server Component dengan streaming                                 |
| `/api/billing/check-status` (GET)    | Perlu polling — harus tetap API atau SSE                                    |
| `/api/admin/plans` (GET)             | Server Component                                                            |
| `/api/health` (GET)                  | Bisa dikecualikan dari rewrite, tetap jadi API untuk health check eksternal |
| `/api/analytics` (GET)               | Tergantung apakah dipanggil dari client atau server                         |

**Catatan:** Beberapa GET di atas (`/api/billing/check-status`, `/api/orders/check-status`) melakukan **polling** — artinya client memanggil berulang dari browser. Ini tidak cocok untuk Server Component tapi bisa diganti dengan SSE atau WebSocket.

---

### Kategori D: Route yang masih perlu dikaji (grey area)

| Route                            | Kondisi                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `site/contact/route.ts` (POST)   | Dipanggil dari form kontakpublik site — kemungkinan tetap perlu API |
| `post/search/route.ts`           | Bisa jadi Server Action, tapi query string lebih cocok di API       |
| `domain/domains/verify/route.ts` | Dipanggil setelah user klik "verify domain" — Server Action bisa    |
| `auth/affiliate/check/route.ts`  | GET dengan query param — cocok sebagai Server Component             |
| `shared/openapi/route.ts`        | OpenAPI spec — harus tetap API (diakses oleh tools eksternal)       |
| `site/health/route.ts`           | Health check — harus tetap API (diakses oleh load balancer)         |

---

## Jawaban: Dapatkah Tanpa API Route?

**Tidak sepenuhnya, tapi bisa dikurangi drastis.**

### Kondisi saat ini: 74 route

### Target realistis setelah refaktor: ~20–25 route

| Kategori                              | Jumlah Sekarang | Setelah Refaktor |
| ------------------------------------- | --------------- | ---------------- |
| Wajib tetap (webhook, upload, publik) | ~14             | ~14              |
| Kandidat Server Actions               | ~28             | **0** (hapus)    |
| Kandidat Server Component GET         | ~14             | **0** (hapus)    |
| Grey area                             | ~6              | ~6               |
| Tidak teridentifikasi / sisa          | ~12             | ~5               |
| **Total**                             | **74**          | **~20–25**       |

---

## Masalah Utama: Rewrite Rule yang Tidak Terkontrol

Bahkan jika API route dikurangi, masalah **URL lama vs URL baru** tetap ada selama:

1. `next.config.js` masih punya 33 rewrite rule aktif
2. Client masih memanggil URL lama (`/api/orders`, `/api/billing/*`, dll.)
3. Tidak ada versioning atau deprecation notice

### Dampak konkret:

```
Client memanggil: /api/orders
next.config.js merewrite ke: /api/order/orders
File aktual: src/app/api/order/orders/route.ts
```

Jika suatu saat rewrite dihapus tanpa memperbarui client → **silent 404, tidak ada error di compile time**.

### Rekomendasi segera:

Tambahkan komentar `@deprecated` dan target tanggal penghapusan di setiap rewrite:

```js
// DEPRECATED: URL lama, migrasi client selesai 2026-09-01
// Client target: ganti dengan Server Actions
{ source: '/api/orders/:path*', destination: '/api/order/orders/:path*' },
```

---

## Mengapa Server Actions Lebih Baik untuk Dashboard?

### Keuntungan

| Aspek          | API Route                    | Server Action                           |
| -------------- | ---------------------------- | --------------------------------------- |
| Type safety    | ❌ Tidak ada (JSON boundary) | ✅ Penuh (TypeScript end-to-end)        |
| CSRF           | ⚠️ Manual (`validateCsrf()`) | ✅ Built-in oleh Next.js                |
| Auth check     | ⚠️ Duplikat di tiap route    | ✅ Bisa terpusat di action wrapper      |
| Bundle size    | Neutral                      | ✅ Tidak perlu client fetch boilerplate |
| Error handling | ❌ HTTP status code manual   | ✅ `try/catch` + `useFormState`         |
| URL publik     | ⚠️ Bisa diakses langsung     | ✅ Tidak punya URL publik               |
| Validasi       | ❌ Manual Zod di route       | ✅ Bisa pakai Zod di server action      |
| Loading state  | ❌ Manual `useState`         | ✅ `useFormStatus()` built-in           |

### Keterbatasan Server Actions

| Keterbatasan                             | Dampak                                            |
| ---------------------------------------- | ------------------------------------------------- |
| Tidak bisa streaming response            | Route seperti media proxy harus tetap API         |
| Tidak bisa dipanggil dari luar Next.js   | Webhook harus tetap API                           |
| Tidak bisa dipanggil dari domain berbeda | Cross-domain (site publik tenant) harus tetap API |
| Tidak ada URL yang bisa di-bookmark/test | API testing via Postman tidak bisa                |
| Response hanya JSON/void                 | Upload multipart harus tetap API                  |

---

## Rencana Migrasi Bertahap

### Tahap 1 — Standardisasi URL (Tanpa mengubah kode route)

1. Perbarui semua client (dashboard, admin) untuk menggunakan **URL baru** (`/api/order/orders` bukan `/api/orders`)
2. Tandai semua rewrite rule sebagai `@deprecated` dengan deadline
3. Tambahkan header `Deprecation` di route lama

```ts
// src/app/api/order/orders/route.ts — tambahkan di top
// Tetap di sini. URL lama /api/orders akan dihapus setelah semua client diperbarui.
```

### Tahap 2 — Migrasi GET ke Server Component

Untuk route GET yang dipanggil dari dashboard:

- Ubah Client Component yang melakukan `fetch("/api/pages")` menjadi Server Component
- Server Component langsung memanggil `PageClient.getPages()` tanpa HTTP

**Sebelum:**

```tsx
// dashboard/pages/page.tsx — "use client"
useEffect(() => {
  fetch("/api/pages")
    .then((r) => r.json())
    .then(setPosts);
}, []);
```

**Sesudah:**

```tsx
// dashboard/pages/page.tsx — Server Component
import { PageClient } from "@/modules/page";
const pages = await PageClient.getPages(siteId);
return <PageList pages={pages} />;
```

### Tahap 3 — Migrasi mutasi ke Server Actions

Untuk route POST/PUT/PATCH/DELETE dari dashboard:

**Sebelum:**

```tsx
// "use client"
const res = await fetch("/api/posts", {
  method: "POST",
  body: JSON.stringify(data),
});
```

**Sesudah:**

```ts
// src/modules/post/actions/post.actions.ts
"use server";
export async function createPostAction(data: CreatePostInput) {
  const { siteId, error } = await getApiContext(["owner", "editor"]);
  if (error) throw new Error(error);
  return PostClient.createPost(siteId, data);
}
```

```tsx
// "use client"
import { createPostAction } from "@/modules/post/actions/post.actions";
const result = await createPostAction(data); // no fetch, no URL
```

### Tahap 4 — Hapus rewrite rule dan URL lama

Setelah semua client diperbarui:

1. Hapus rewrite rule dari `next.config.js`
2. Route yang sudah diganti Server Actions → hapus file route
3. Sisakan hanya ~20 route yang benar-benar perlu

---

## Route yang Tetap Wajib Ada (Tidak Bisa Dihapus)

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts      ← NextAuth OAuth callback
│   ├── bridge/route.ts             ← Cross-domain SSO
│   └── bridge/accept/route.ts     ← Cross-domain SSO
├── media/
│   ├── proxy/route.ts              ← Image proxy + Sharp streaming
│   └── route.ts (POST)            ← File upload multipart
├── order/
│   ├── orders/route.ts (POST)     ← Checkout publik (site visitor)
│   ├── orders/check-status/route.ts ← Polling dari checkout publik
│   ├── orders/payment/route.ts    ← Init payment (butuh req.headers)
│   ├── orders/payment-methods/route.ts ← Checkout publik
│   └── orders/webhook/duitku/route.ts ← External webhook Duitku
├── payment/
│   └── billing/webhook/duitku/route.ts ← External webhook Duitku
├── post/
│   └── testimonials/route.ts (POST) ← Submit testimonial publik
├── site/
│   ├── contact/route.ts (POST)    ← Form kontak publik
│   └── health/route.ts            ← Health check load balancer
├── shared/
│   └── openapi/route.ts           ← OpenAPI spec (akses tools eksternal)
└── subscription/
    └── cron/check-subscriptions/route.ts ← External cron job
```

**Total: ~15–18 route**

---

## Kesimpulan

> **Bisa, tapi bukan "tanpa API route" — melainkan API route yang jauh lebih sedikit dan purposeful.**

Dari 74 route yang ada:

- **~14 route**: wajib tetap (webhook, streaming, publik, NextAuth, cron)
- **~28 route**: bisa dihapus setelah migrasi ke **Server Actions**
- **~14 route**: bisa dihapus setelah migrasi ke **Server Component** (GET)
- **~18 sisanya**: perlu evaluasi case-by-case

Prioritas paling mendesak sebelum migrasi:

1. **Bersihkan rewrite rule** — tandai deprecated, perbarui client ke URL baru
2. **Buat `actions/` folder** di setiap modul yang relevan
3. **Migrasi GET dashboard** ke Server Component dulu (lebih mudah)
4. **Migrasi mutasi** ke Server Actions per modul
