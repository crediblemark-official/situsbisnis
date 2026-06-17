# Analisis Status Migrasi API Route → Modules

**Tanggal:** 17 Juni 2026  
**Scope:** `src/app/api/` → `src/modules/*/actions/` (Server Actions)

---

## Ringkasan Eksekutif

Migrasi ke modular monolith baru **setengah jalan** — Server Actions sudah dibuat di beberapa modul, tapi client komponen belum diperbarui untuk menggunakannya. Dua jalur (API route + Server Actions) hidup berdampingan secara tidak konsisten.

---

## 1. Bug Aktif: Folder API Kosong (route.ts tidak ada)

Folder berikut **dibuat tapi kosong** — tidak ada `route.ts` di dalamnya, padahal rewrite rule di `next.config.js` mengarah ke sana:

```
src/app/api/auth/register/          ← kosong → /api/register → 404
src/app/api/auth/user/              ← kosong → /api/user → 404
src/app/api/auth/onboarding/        ← kosong → /api/onboarding → 404
src/app/api/auth/profile/           ← kosong → /api/profile → 404
src/app/api/auth/affiliate/check/   ← kosong
src/app/api/auth/affiliate/withdraw/ ← kosong
src/app/api/catalog/                ← kosong total (tidak ada subfolder)
```

**Aksi:** Hapus folder kosong ini. Logic sudah ada di `auth.actions.ts`. Update client yang memanggilnya.

---

## 2. API Routes "Stub" — Setengah Jalan ke Module API

File route yang hanya meneruskan ke `src/modules/*/api/`:

```ts
// src/app/api/media/gallery/route.ts
export { galleryApi as GET } from "@/modules/media/api";

// src/app/api/media/portfolios/route.ts
export { portfolioApi as GET, portfolioApi as POST } from "@/modules/media/api";

// src/app/api/post/testimonials/route.ts
export {
  testimonialApi as GET,
  testimonialApi as POST,
} from "@/modules/post/api";
```

**Masalah:** Gallery, Portfolio, Testimonial sudah punya Server Actions di `media.actions.ts` dan `post.actions.ts`, tapi client komponen masih memanggil `fetch("/api/portfolios/...")` dan `fetch("/api/testimonials/...")`. Dua jalur aktif bersamaan.

---

## 3. Inkonsistensi: Actions Ada, Client Belum Dimigrasi

Ini inkonsistensi terbesar.

| Modul   | Actions               | Komponen UI yang masih `fetch()`                                                                                                                                          |
| ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post`  | ✅ `post.actions.ts`  | `TestimonialCard.tsx`, `testimonials/[id]/page.tsx` → `fetch("/api/testimonials/...")`                                                                                    |
| `media` | ✅ `media.actions.ts` | `PortfolioEditor.tsx`, `PortfolioList.client.tsx`, `dashboard/media/page.tsx` → `fetch("/api/portfolios/...")`, `fetch("/api/media")`                                     |
| `site`  | ✅ `site.actions.ts`  | `Header.tsx`, `Footer.tsx`, `FloatingChat.tsx`, `DashboardShell.tsx`, `use-currency.ts`, `use-platform-settings.ts` → `fetch("/api/settings")`, `fetch("/api/menus/...")` |
| `page`  | ✅ `page.actions.ts`  | `dashboard/pages/[id]/page.tsx` → `fetch("/api/pages/...")`                                                                                                               |

### Kasus Khusus: `fetch("/api/settings")` di Shared Module

Dipanggil dari 6 tempat berbeda:

- `modules/shared/ui/layout/Header.tsx`
- `modules/shared/ui/layout/Footer.tsx`
- `modules/shared/ui/ui/FloatingChat.tsx`
- `modules/shared/ui/dashboard/DashboardShell.tsx`
- `modules/shared/hooks/use-currency.ts`
- `modules/shared/hooks/use-platform-settings.ts`

Ini **tidak bisa diganti Server Action langsung** karena dipanggil dari client context. Solusi: lift data ke Server Component parent (layout) dan inject via React Context.

---

## 4. Modul Belum Punya Actions Sama Sekali

| Modul            | Status                  | Komponen yang terdampak                                                                                                                           |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order`          | ❌ tidak ada `actions/` | `OrderStatusManager.tsx` → `fetch("/api/orders/...")`                                                                                             |
| `subscription`   | ❌ tidak ada `actions/` | `SubscriptionDetailModal.tsx` → `fetch("/api/admin/plans")`, `admin/subscriptions/SubscriptionList.tsx` → `fetch("/api/admin/subscriptions/...")` |
| `infrastructure` | ❌ tidak ada `actions/` | `BackupClient.tsx` → `fetch("/api/admin/backup")`, `admin/sites/SiteList.tsx` → `fetch("/api/admin/sites/...")`                                   |
| `domain`         | ❌ tidak ada `actions/` | —                                                                                                                                                 |
| `notification`   | ❌ tidak ada `actions/` | —                                                                                                                                                 |
| `crud`           | ❌ tidak ada `actions/` | —                                                                                                                                                 |

---

## 5. Rewrite Rules yang Belum Bersih

`next.config.js` masih punya 30+ rewrite rules aktif. Beberapa sudah di-comment `DEPRECATED` tapi client masih menggunakan URL lama:

```js
// Masih aktif di next.config.js
{ source: '/api/settings/:path*', destination: '/api/site/settings/:path*' },
{ source: '/api/gallery/:path*',  destination: '/api/media/gallery/:path*' },
{ source: '/api/portfolios/:path*', destination: '/api/media/portfolios/:path*' },
// dll.
```

---

## Roadmap Migrasi

### Fase 1 — Fix Bug Aktif (prioritas sekarang)

- Hapus folder `src/app/api/auth/register/`, `user/`, `onboarding/`, `profile/` yang kosong
- Hapus folder `src/app/api/catalog/` yang kosong
- Pastikan rewrite rules untuk route ini juga dihapus atau dialihkan ke actions

### Fase 2 — Selesaikan yang Setengah Jalan (media, post)

- Migrasi `TestimonialCard.tsx` + `testimonials/[id]/page.tsx` → pakai `post.actions.ts`
- Migrasi `PortfolioEditor.tsx` + `PortfolioList.client.tsx` + `dashboard/media/page.tsx` → pakai `media.actions.ts`
- Hapus stub routes: `media/gallery/route.ts`, `media/portfolios/route.ts`, `post/testimonials/route.ts` (GET tetap untuk publik)

### Fase 3 — Buat Actions untuk 4 Modul (order, subscription, infrastructure, domain)

- Buat `src/modules/order/actions/order.actions.ts`
- Buat `src/modules/subscription/actions/subscription.actions.ts`
- Buat `src/modules/infrastructure/actions/infrastructure.actions.ts`
- Buat `src/modules/domain/actions/domain.actions.ts`
- Migrasi client components yang terdampak

### Fase 4 — Tangani shared/settings Secara Arsitektural

- Buat `SiteSettingsContext` yang diisi dari Server Component di `(site)/layout.tsx` dan `dashboard/layout.tsx`
- Hapus semua `fetch("/api/settings")` dari client components
- Hapus `use-platform-settings.ts` hook berbasis fetch

### Fase 5 — Hapus Rewrite Rules

- Setelah semua client dimigrasi, hapus rewrite rules dari `next.config.js` satu per satu

---

## Route yang WAJIB Tetap Ada (Tidak Dimigrasi)

```
auth/[...nextauth]/route.ts                    ← OAuth callback NextAuth
payment/billing/webhook/duitku/route.ts        ← External webhook Duitku
order/orders/webhook/duitku/route.ts           ← External webhook Duitku
subscription/cron/check-subscriptions/route.ts ← External cron job
auth/bridge/route.ts + bridge/accept/route.ts  ← Cross-domain SSO
media/proxy/route.ts                           ← Image streaming + Sharp
media/route.ts (POST)                          ← File upload multipart
site/health/route.ts                           ← Health check load balancer
site/contact/route.ts (POST)                   ← Form kontak visitor publik
shared/openapi/route.ts                        ← OpenAPI spec tools eksternal
order/orders/route.ts (POST)                   ← Checkout publik (site visitor)
order/orders/check-status/route.ts             ← Polling checkout publik
order/orders/payment/route.ts                  ← Init payment (butuh req.headers)
order/orders/payment-methods/route.ts          ← Checkout publik
post/testimonials/route.ts (POST)              ← Submit testimonial visitor publik
```

---

## Target Akhir

|                                                             | Sekarang  | Target |
| ----------------------------------------------------------- | --------- | ------ |
| Total API routes                                            | ~74       | ~15–18 |
| Modul dengan actions                                        | 8/14      | 14/14  |
| Client yang masih pakai `fetch("/api/...")` untuk dashboard | ~35 calls | 0      |
| Rewrite rules aktif                                         | 30        | 0      |
