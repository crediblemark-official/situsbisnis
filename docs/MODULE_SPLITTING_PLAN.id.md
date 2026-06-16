# Rencana Pemecahan Modul: Module Splitting

**Tanggal**: 16 Juni 2026
**Status**: Draft Rencana

---

## Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [Kondisi Saat Ini](#2-kondisi-saat-ini)
3. [Target Arsitektur](#3-target-arsitektur)
4. [Pemecahan tenant](#4-pemecahan-tenant)
5. [Pemecahan billing](#5-pemecahan-billing)
6. [Pemecahan content](#6-pemecahan-content)
7. [Daftar Lengkap Module Baru](#7-daftar-lengkap-module-baru)
8. [Migrasi Event Contracts](#8-migrasi-event-contracts)
9. [Perubahan Dependency Cruiser](#9-perubahan-dependency-cruiser)
10. [Perubahan Path Aliases](#10-perubahan-path-aliases)
11. [Perubahan instrumentation.ts](#11-perubahan-instrumentationts)
12. [Tahapan Migrasi](#12-tahapan-migrasi)
13. [Testing Strategy](#13-testing-strategy)

---

## 1. Ringkasan

### Masalah
Tiga module saat ini terlalu gemuk menangani banyak tanggung jawab yang tidak kohesif:

| Module | LOC | Tanggung Jawab |
|--------|-----|----------------|
| tenant | 5,745 | site + domain + email/notifikasi + provisioning + analytics + backup + contact |
| billing | 5,167 | plan/langganan + transaksi/checkout + coupon/withdrawal + admin settings |
| content | 3,159 | post + page + media + gallery + portfolio + testimonial + menu + taxonomy + search + editor |

### Prinsip Pemecahan

1. **Single Responsibility** — Satu module = satu domain bisnis
2. **Cohesion** — Fungsi dalam satu module harus saling terkait erat
3. **Independence** — Module baru harus bisa berdiri sendiri (tidak saling import)
4. **Backward Compatible** — Facade lama tetap jalan sebagai kompatibilitas selama transisi
5. **Minimal Event Contract Changes** — Event yang sudah ada tidak perlu diubah, hanya dispatcher/listener-nya saja

---

## 2. Kondisi Saat Ini

### 2.1 Struktur Module Saat Ini

```
src/modules/
├── auth/         14 files  — OK
├── billing/      33 files  🔴 GEMUK
├── catalog/      19 files  — OK
├── content/      37 files  🔴 GEMUK
├── order/        18 files  — OK
├── tenant/       41 files  🔴 GEMUK (TERGEMUK)
└── shared/       86 files  — OK (infrastructure)
```

### 2.2 Dependency Graph Saat Ini (via Event Bus)

```
auth ◄──request──► billing
  │                    │
  │                    ▼
  ▼               tenant ◄──request──► catalog
content ◄──request──►    │
  │                      │
  ▼                      ▼
order               notification
                    (via event)
```

### 2.3 Isi tenant (yang paling gemuk — 5 tanggung jawab)

| Area | Controller | Services | Repos | UI Files |
|------|-----------|----------|-------|----------|
| **Site** (CRUD + settings) | `tenant.controller` | `site.service`, `site-settings.service`, `settings.service` | `tenant.repository`, `settings.repository` | Dashboard settings (BrandingTab, SEOTab), admin (GeneralTab) |
| **Domain** | `domain.controller` | `domain.service` | `domain.repository` | - |
| **Notification** | (via event listener) | `email.service`, `contact.service`, `analytics.service` | - | - |
| **Provisioning** | `provisioning.controller` | `provisioning.service`, `dokploy.service` | `provisioning.repository` | - |
| **Infrastructure** | - | `backup.service` | - | Admin (BackupClient) |

### 2.4 Isi billing (4 tanggung jawab)

| Area | Services | Repos | UI Files |
|------|----------|-------|----------|
| **Plan & Subscription** | `plan.service`, `limit.service`, `platform.service` | `plan.repository`, `subscription.repository` | PlansList, TrialBanner, FeaturesMatrix, AddonSlots, SubscriptionModal |
| **Payment** | `transaction.service`, `checkout.service`, `webhook.service` | `transaction.repository` | PaymentConfirmation, PaymentMethodSelector, TransactionHistory |
| **Financial** | `coupon.service`, `withdrawal.service`, `settings.service`, `admin.service`, `followup.service` | `coupon.repository`, `billing.repository` | CouponList, WithdrawalList, HistoryBillClient |
| **Admin Billing** | (via admin.service) | - | BillingClient (dashboard page) |

### 2.5 Isi content (5 tanggung jawab)

| Area | Controller | Services | Repos | UI Files |
|------|-----------|----------|-------|----------|
| **Post / Blog** | `content.controller` | `post.service`, `taxonomy.service`, `testimonial.service` | `taxonomy.repository` | blog/ShareButtons |
| **Media** | `content.controller` | `media.service`, `gallery.service`, `portfolio.service` | `media.repository` | MediaBreadcrumbs, MediaFolderCard, GallerySection |
| **Page / CMS** | `content.controller`, `menu.controller` | `page.service`, `menu.service`, `content.service`, `content-display.service`, `search.service` | `page.repository`, `menu.repository`, `content.repository` | credbuild/, editor/, pages/ |
| **Gallery** | (via content.controller) | (via gallery.service) | - | - |
| **Portfolio** | (via content.controller) | (via portfolio.service) | - | - |

---

## 3. Target Arsitektur

### 3.1 Module Baru

```
src/modules/
├── auth/              14 files  — TETAP
├── catalog/           19 files  — TETAP
├── order/             18 files  — TETAP
├── shared/            86 files  — TETAP
│
├── site/              ← DARI tenant (site CRUD, settings, branding)
├── domain/            ← DARI tenant (domain verify, register, remove)
├── notification/      ← DARI tenant (email, contact form, analytics, followup)
├── infrastructure/    ← DARI tenant (provisioning, dokploy, backup)
│
├── subscription/      ← DARI billing (plan, limit, platform settings)
├── payment/           ← DARI billing (transaction, checkout, webhook)
├── financial/         ← DARI billing (coupon, withdrawal, admin billing)
│
├── post/              ← DARI content (post, taxonomy, testimonial, search)
├── media/             ← DARI content (media, gallery, portfolio)
└── page/              ← DARI content (page, credbuild, menu, content-display)
```

**Total: 7 → 14 module** (+7 module baru)

### 3.2 Dependency Graph Target

```
                    ┌──────────┐
                    │   site   │
                    └────┬─────┘
                         │ request
                    ┌────▼─────┐
         ┌──────────│  domain  │──────────┐
         │          └──────────┘          │
         │ request               request  │
    ┌────▼─────┐              ┌──────────▼───┐
    │  auth    │              │ notification │
    └────┬─────┘              └──────┬───────┘
         │ request                   │ subscribe
    ┌────▼─────┐         ┌──────────▼────┐
    │ payment  │◄────────│ subscription  │────► post, media, page
    └────┬─────┘ publish └───────────────┘      (quota events)
         │ request
    ┌────▼──────┐
    │ financial │
    └───────────┘

order ──request──► catalog
                    │
                    ▼
              post, media, page
              (via content-display)
```

### 3.3 Prinsip Komunikasi

| Skenario | Cara |
|----------|------|
| Site cek limit | `site` → `request.billing.checkLimit` → `subscription` reply |
| Payment selesai | `payment` → publish `billing.payment.completed` → `notification` subscribe kirim WA/Email |
| Order butuh data produk | `order` → `request.catalog.getProduct` → `catalog` reply |
| Page display butuh produk | `page` → `request.catalog.getProducts` → `catalog` reply |
| Subscription berubah | `subscription` → publish `billing.subscription.changed` → `post`, `media`, `page` update quota |

---

## 4. Pemecahan tenant

### 4.1 site (module baru)

**Tanggung jawab**: Manajemen situs, settings, branding, payment settings, analytics views

| File | Asal |
|------|------|
| `site/index.ts` | Baru — facade `SiteClient` |
| `site/services/site.service.ts` | Dari `tenant/services/site.service.ts` |
| `site/services/site-settings.service.ts` | Dari `tenant/services/site-settings.service.ts` |
| `site/services/settings.service.ts` | Dari `tenant/services/settings.service.ts` |
| `site/services/analytics.service.ts` | Dari `tenant/services/analytics.service.ts` |
| `site/repositories/tenant.repository.ts` | Dari `tenant/repositories/tenant.repository.ts` (rename → `site.repository.ts`) |
| `site/repositories/settings.repository.ts` | Dari `tenant/repositories/settings.repository.ts` |
| `site/controllers/tenant.controller.ts` | Dari `tenant/controllers/tenant.controller.ts` (rename → `site.controller.ts`) |
| `site/controllers/settings.controller.ts` | Dari `tenant/controllers/settings.controller.ts` |
| `site/ui/dashboard/settings/*` | Dari `tenant/ui/dashboard/settings/*` |
| `site/ui/admin/settings/*` | Dari `tenant/ui/admin/settings/*` |
| `site/ui/site/ThemeClientUtilities.tsx` | Dari `tenant/ui/site/ThemeClientUtilities.tsx` |
| `site/listeners/index.ts` | Dari `tenant/listeners/index.ts` (ambil bagian site) |

**Facade**:
```typescript
export const SiteClient = {
    getSiteInfo, getSiteContact, getSiteDetail, getSiteDomainInfo,
    verifyUserSiteAccess, associateUserToSite, disassociateUserFromSite,
    getSiteUserIds, checkSubdomainAvailability, getUserSiteCount,
    deleteSite, savePaymentSettings, getOrIncrementViews, pingDatabase,
    getSiteSettings, updateSiteSettings
};
```

**Listeners**:
- `request.tenant.getSiteInfo` → `request.site.getSiteInfo`
- `request.tenant.getSiteContact` → `request.site.getSiteContact`
- `request.tenant.verifyAccess` → `request.site.verifyAccess`

### 4.2 domain (module baru)

**Tanggung jawab**: Custom domain registration, verification, removal

| File | Asal |
|------|------|
| `domain/index.ts` | Baru — facade `DomainClient` |
| `domain/services/domain.service.ts` | Dari `tenant/services/domain.service.ts` |
| `domain/repositories/domain.repository.ts` | Dari `tenant/repositories/domain.repository.ts` |
| `domain/controllers/domain.controller.ts` | Dari `tenant/controllers/domain.controller.ts` |
| `domain/listeners/index.ts` | Dari `tenant/listeners/index.ts` (ambil bagian domain) |

**Facade**:
```typescript
export const DomainClient = {
    registerDomain, verifyDomain, removeDomain
};
```

### 4.3 notification (module baru)

**Tanggung jawab**: Email, WhatsApp, contact form, follow-up notifications, analytics

| File | Asal |
|------|------|
| `notification/index.ts` | Baru — facade `NotificationClient` |
| `notification/services/email.service.ts` | Dari `tenant/services/email.service.ts` |
| `notification/services/contact.service.ts` | Dari `tenant/services/contact.service.ts` |
| `notification/services/followup.service.ts` | Dari `billing/services/followup.service.ts` (pindah sini) |
| `notification/services/analytics.service.ts` | Dari `tenant/services/analytics.service.ts` |
| `notification/listeners/index.ts` | Dari `tenant/listeners/index.ts` (ambil bagian notifikasi) + `billing/listeners/` (followup) |

**Note**: `notification` adalah module yang paling banyak subscribe event. Dia menerima:
- `billing.payment.completed` → kirim WA + Email
- `billing.subscription.changed` → kirim notifikasi
- `user.registered` → kirim welcome email
- `order.fulfilled` → kirim notifikasi

### 4.4 infrastructure (module baru)

**Tanggung jawab**: Provisioning situs, deployment (Dokploy), backup database

| File | Asal |
|------|------|
| `infrastructure/index.ts` | Baru — facade `InfrastructureClient` |
| `infrastructure/services/provisioning.service.ts` | Dari `tenant/services/provisioning.service.ts` |
| `infrastructure/services/dokploy.service.ts` | Dari `tenant/services/dokploy.service.ts` |
| `infrastructure/services/backup.service.ts` | Dari `tenant/services/backup.service.ts` |
| `infrastructure/repositories/provisioning.repository.ts` | Dari `tenant/repositories/provisioning.repository.ts` |
| `infrastructure/controllers/provisioning.controller.ts` | Dari `tenant/controllers/provisioning.controller.ts` |
| `infrastructure/ui/admin/BackupClient.tsx` | Dari `tenant/ui/admin/BackupClient.tsx` |

---

## 5. Pemecahan billing

### 5.1 subscription (module baru)

**Tanggung jawab**: Plan management, subscription lifecycle, limit/quota checking, platform settings

| File | Asal |
|------|------|
| `subscription/index.ts` | Baru — facade `SubscriptionClient` |
| `subscription/services/plan.service.ts` | Dari `billing/services/plan.service.ts` |
| `subscription/services/limit.service.ts` | Dari `billing/services/limit.service.ts` |
| `subscription/services/platform.service.ts` | Dari `billing/services/platform.service.ts` |
| `subscription/repositories/plan.repository.ts` | Dari `billing/repositories/plan.repository.ts` |
| `subscription/repositories/subscription.repository.ts` | Dari `billing/repositories/subscription.repository.ts` |
| `subscription/repositories/billing.repository.ts` | Dari `billing/repositories/billing.repository.ts` (sisa) |
| `subscription/ui/dashboard/billing/*` | Dari `billing/ui/dashboard/billing/*` (bagian plan) |
| `subscription/ui/dashboard/subscriptions/*` | Dari `billing/ui/dashboard/subscriptions/*` |
| `subscription/listeners/index.ts` | Dari `billing/listeners/index.ts` |

**Facade**:
```typescript
export const SubscriptionClient = {
    getPricingPlans, getActivePlanNamesForSites, checkSiteLimit,
    getAllPlans, getSubscriptionDetail, getActiveSubscription,
    extendSubscription, cancelSubscription, updateSubscriptionPlan,
    setSiteToFreePlan, extendSiteTrial, upsertPlans,
    checkUserSitesLimit, getPlatformSettings,
    getPricingPlans, getSiteSettingsBillingContext,
    getSubscriptionContext, getAdminSettingsContext
};
```

### 5.2 payment (module baru)

**Tanggung jawab**: Transaksi pembayaran, checkout, Duitku webhook, payment methods

| File | Asal |
|------|------|
| `payment/index.ts` | Baru — facade `PaymentClient` |
| `payment/services/transaction.service.ts` | Dari `billing/services/transaction.service.ts` |
| `payment/services/checkout.service.ts` | Dari `billing/services/checkout.service.ts` |
| `payment/services/webhook.service.ts` | Dari `billing/services/webhook.service.ts` |
| `payment/repositories/transaction.repository.ts` | Dari `billing/repositories/transaction.repository.ts` |
| `payment/ui/dashboard/billing/*` | Dari `billing/ui/dashboard/billing/*` (bagian payment) |

**Facade**:
```typescript
export const PaymentClient = {
    processApprovedTransaction, updateTransactionStatus,
    buySlot, cancelTransaction, checkTransactionStatus,
    initializeCheckoutPayment, confirmManualPayment,
    extendTrial, getPaymentMethods, upgradePlan,
    processDuitkuWebhook
};
```

### 5.3 financial (module baru)

**Tanggung jawab**: Coupon, withdrawal, admin billing, settings billing

| File | Asal |
|------|------|
| `financial/index.ts` | Baru — facade `FinancialClient` |
| `financial/services/coupon.service.ts` | Dari `billing/services/coupon.service.ts` |
| `financial/services/withdrawal.service.ts` | Dari `billing/services/withdrawal.service.ts` |
| `financial/services/admin.service.ts` | Dari `billing/services/admin.service.ts` |
| `financial/services/settings.service.ts` | Dari `billing/services/settings.service.ts` |
| `financial/repositories/coupon.repository.ts` | Dari `billing/repositories/coupon.repository.ts` |

**Facade**:
```typescript
export const FinancialClient = {
    validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon,
    processWithdrawalStatus,
    updatePlatformSettings, updateAdminPaymentMethods,
    getAdminSite, updateAdminSiteBranding
};
```

---

## 6. Pemecahan content

### 6.1 post (module baru)

**Tanggung jawab**: Blog posts, taxonomy/terms, testimonials, search

| File | Asal |
|------|------|
| `post/index.ts` | Baru — facade `PostClient` |
| `post/services/post.service.ts` | Dari `content/services/post.service.ts` |
| `post/services/taxonomy.service.ts` | Dari `content/services/taxonomy.service.ts` |
| `post/services/testimonial.service.ts` | Dari `content/services/testimonial.service.ts` |
| `post/services/search.service.ts` | Dari `content/services/search.service.ts` (pencarian global) |
| `post/repositories/taxonomy.repository.ts` | Dari `content/repositories/taxonomy.repository.ts` |
| `post/ui/blog/ShareButtons.tsx` | Dari `content/ui/blog/ShareButtons.tsx` |

**Facade**:
```typescript
export const PostClient = {
    countPosts, getPost, getPosts,
    getTerms, createTerm, deleteTerm, updateTerm,
    getTestimonials, countTestimonials,
    searchAll
};
```

### 6.2 media (module baru)

**Tanggung jawab**: Media library (upload, folder, delete), gallery, portfolio

| File | Asal |
|------|------|
| `media/index.ts` | Baru — facade `MediaClient` |
| `media/services/media.service.ts` | Dari `content/services/media.service.ts` |
| `media/services/gallery.service.ts` | Dari `content/services/gallery.service.ts` |
| `media/services/portfolio.service.ts` | Dari `content/services/portfolio.service.ts` |
| `media/repositories/media.repository.ts` | Dari `content/repositories/media.repository.ts` |
| `media/ui/dashboard/media/*` | Dari `content/ui/dashboard/media/*` |
| `media/ui/GallerySection.tsx` | Dari `content/ui/GallerySection.tsx` |

**Facade**:
```typescript
export const MediaClient = {
    getMediaSize, getMediaList, uploadMedia, deleteMedia,
    getMediaFolders, createMediaFolder, deleteMediaFolder,
    countMediaItems, countGalleryItems, countPortfolioItems,
    getGalleryItems, getPortfolios
};
```

### 6.3 page (module baru)

**Tanggung jawab**: Visual builder pages (CredBuild), regular pages, menus, content display, content repository

| File | Asal |
|------|------|
| `page/index.ts` | Baru — facade `PageClient` |
| `page/services/page.service.ts` | Dari `content/services/page.service.ts` |
| `page/services/menu.service.ts` | Dari `content/services/menu.service.ts` |
| `page/services/content.service.ts` | Dari `content/services/content.service.ts` |
| `page/services/content-display.service.ts` | Dari `content/services/content-display.service.ts` |
| `page/repositories/page.repository.ts` | Dari `content/repositories/page.repository.ts` |
| `page/repositories/menu.repository.ts` | Dari `content/repositories/menu.repository.ts` |
| `page/repositories/content.repository.ts` | Dari `content/repositories/content.repository.ts` |
| `page/controllers/content.controller.ts` | Dari `content/controllers/content.controller.ts` |
| `page/controllers/menu.controller.ts` | Dari `content/controllers/menu.controller.ts` |
| `page/ui/credbuild/*` | Dari `content/ui/credbuild/*` |
| `page/ui/editor/*` | Dari `content/ui/editor/*` |
| `page/ui/dashboard/pages/*` | Dari `content/ui/dashboard/pages/*` |
| `page/listeners/index.ts` | Dari `content/listeners/index.ts` |

**Facade**:
```typescript
export const PageClient = {
    getPages, getPageDetail, savePage, deletePage,
    getCredBuildPage, saveCredBuildPage,
    getMenu, updateMenu,
    getPage,
    getPost, getPosts, getGalleryItems, getPortfolios, getTestimonials
    // → ini sebenarnya delegasi ke PostClient/MediaClient via event bus
};
```

**PENTING**: `content-display.service.ts` dan `page/index.ts` facade adalah **router** yang memanggil module lain via event bus untuk aggregasi data. Module ini adalah satu-satunya module yang BOLEH punya dependensi ke banyak module lain (via event bus).

---

## 7. Daftar Lengkap Module Baru

| No | Module Baru | Parent | LOC Estimasi | Files | Tanggung Jawab Utama |
|----|------------|--------|-------------|-------|---------------------|
| 1 | **site** | tenant | ~2,000 | ~15 | Site CRUD, settings, branding, analytics |
| 2 | **domain** | tenant | ~600 | ~5 | Custom domain verification |
| 3 | **notification** | tenant | ~1,200 | ~8 | Email, WhatsApp, contact, followup |
| 4 | **infrastructure** | tenant | ~800 | ~7 | Provisioning, Dokploy, backup |
| 5 | **subscription** | billing | ~2,500 | ~15 | Plans, subscription, limits, platform settings |
| 6 | **payment** | billing | ~1,800 | ~10 | Transaction, checkout, webhook, Duitku |
| 7 | **financial** | billing | ~1,200 | ~8 | Coupon, withdrawal, admin billing |
| 8 | **post** | content | ~1,200 | ~8 | Blog, taxonomy, testimonial, search |
| 9 | **media** | content | ~1,000 | ~10 | Media library, gallery, portfolio |
| 10 | **page** | content | ~1,500 | ~15 | Pages, credbuild, menu, content display |

### Ringkasan

| Kategori | Sebelum | Sesudah | Selisih |
|----------|---------|---------|---------|
| **Jumlah module** | 7 | 14 | +7 |
| **Module >30 files** | 3 (tenant 41, content 37, shared 86) | 1 (shared 86) | -2 |
| **Module >4,000 LOC** | 3 (shared, tenant, billing) | 1 (shared) | -2 |
| **Rata-rata LOC/module** | ~4,315 | ~2,157 | -50% |

---

## 8. Migrasi Event Contracts

### 8.1 Event yang Perlu Diubah

Karena module baru punya nama baru, event contracts yang menggunakan prefix tenant/billing/content perlu diubah:

| Event Lama | Event Baru |
|------------|------------|
| `request.tenant.getSiteInfo` | `request.site.getSiteInfo` |
| `request.tenant.getSiteContact` | `request.site.getSiteContact` |
| `request.tenant.verifyAccess` | `request.site.verifyAccess` |
| `request.tenant.registerDomain` | `request.domain.registerDomain` |
| `request.tenant.removeDomain` | `request.domain.removeDomain` |
| `request.tenant.verifyDomain` | `request.domain.verifyDomain` |
| `request.billing.checkLimit` | `request.subscription.checkLimit` |
| `request.billing.getActivePlan` | `request.subscription.getActivePlan` |
| `request.billing.getActiveSubscription` | `request.subscription.getActiveSubscription` |
| `request.content.countPosts` | `request.post.countPosts` |
| `request.content.countTestimonials` | `request.post.countTestimonials` |
| `request.content.getMediaSize` | `request.media.getMediaSize` |
| `billing.payment.completed` | `payment.completed` |
| `billing.subscription.changed` | `subscription.changed` |

### 8.2 Dual-Run Event

Selama transisi, setiap event baru di-dispatch BERSAMAAN dengan event lama:

```typescript
// Phase transisi: dispatch kedua event
await eventBus.publish('payment.completed', payload, 'payment');   // NEW
await eventBus.publish('billing.payment.completed', payload, 'payment'); // OLD (fallback)
```

Setelah semua subscriber migrasi ke event baru, event lama dihapus.

### 8.3 Publishers & Subscribers Baru

| Event | Publisher Baru | Subscribers Baru |
|-------|---------------|------------------|
| `payment.completed` | payment | notification (WA/Email), financial (affiliate), auth (referral) |
| `subscription.changed` | subscription | notification, site (quota update), post (quota), media (quota), page (quota) |
| `order.placed` | order | notification, subscription (limit check) |
| `user.registered` | auth | notification (welcome email) |
| `site.created` | site | subscription (trial init) |
| `site.deleted` | site | subscription (cleanup) |

---

## 9. Perubahan Dependency Cruiser

### 9.1 Module List Baru

```json
{
  "name": "no-cross-module-internal-imports",
  "from": {
    "path": "^src/modules/([^/]+)/"
  },
  "to": {
    "path": "^src/modules/(?!(shared)/)([^/]+)/.+",
    "pathNot": "^src/modules/$1/|^src/modules/[^/]+/index\\.ts|^src/modules/[^/]+/ui/.+"
  }
}

{
  "name": "no-outside-internal-imports",
  "from": {
    "pathNot": "^src/modules/(auth|site|domain|notification|infrastructure|subscription|payment|financial|catalog|post|media|page|order|shared)/"
  },
  "to": {
    "path": "^src/modules/(auth|site|domain|notification|infrastructure|subscription|payment|financial|catalog|post|media|page|order|shared)/.+",
    "pathNot": "^src/modules/[^/]+/index\\.ts|^src/modules/[^/]+/ui/.+"
  }
}
```

### 9.2 Aturan Khusus

Tambahkan aturan untuk mencegah module baru saling import langsung (harus via event bus):

```json
{
  "name": "no-domain-to-domain-imports",
  "comment": "Domain modules tidak boleh saling import langsung. Gunakan event bus.",
  "severity": "error",
  "from": {
    "path": "^src/modules/(auth|site|domain|notification|infrastructure|subscription|payment|financial|catalog|post|media|page|order)/"
  },
  "to": {
    "path": "^src/modules/(auth|site|domain|notification|infrastructure|subscription|payment|financial|catalog|post|media|page|order)/.+"
  }
}
```

---

## 10. Perubahan Path Aliases

### 10.1 tsconfig.json

Hapus alias lama yang spesifik ke module tenant/billing/content, tambah yang baru:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/modules/*": ["./src/modules/*"],
    
    // Hapus alias tenant/billing/content specific
    // "@/components/dashboard/settings/*" → pakai @/modules/site/ui/...
    // "@/components/admin/settings/*"    → pakai @/modules/site/ui/...
    // "@/components/site/*"              → pakai @/modules/site/ui/site/*
    // "@/components/dashboard/billing/*" → pakai @/modules/subscription|payment/ui/...
    // "@/components/dashboard/subscriptions/*" → pakai @/modules/subscription/ui/...
    
    // Tambah alias baru untuk module baru
    "@/components/dashboard/settings/*": ["./src/modules/site/ui/dashboard/settings/*"],
    "@/components/admin/settings/*": ["./src/modules/site/ui/admin/settings/*"],
    "@/components/site/*": ["./src/modules/site/ui/site/*"],
    "@/components/dashboard/billing/*": ["./src/modules/subscription/ui/dashboard/billing/*"],
    "@/components/dashboard/subscriptions/*": ["./src/modules/subscription/ui/dashboard/subscriptions/*"],
    "@/components/admin/BackupClient": ["./src/modules/infrastructure/ui/admin/BackupClient"],
    
    // Shared tetap
    "@/components/*": ["./src/modules/shared/ui/*"],
    "@/lib/*": ["./src/modules/shared/utils/*"],
    "@/lib/core/*": ["./src/modules/shared/core/*"],
    "@/hooks/*": ["./src/modules/shared/hooks/*"],
    "@/themes/*": ["./src/modules/shared/themes/*"],
    "@/types/*": ["./src/modules/shared/types/*"]
  }
}
```

### 10.2 vitest.config.ts

Hapus alias `@/lib/modules/*` yang sudah tidak ada (masih sisa dari migrasi sebelumnya).

---

## 11. Perubahan instrumentation.ts

```typescript
// src/instrumentation.ts

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { eventBus } = await import("@/modules/shared/core/event-bus");
    
    // Init event bus
    await eventBus.init();
    
    // Init semua listeners module baru
    const { initSiteListeners } = await import("@/modules/site/listeners");
    const { initDomainListeners } = await import("@/modules/domain/listeners");
    const { initNotificationListeners } = await import("@/modules/notification/listeners");
    const { initSubscriptionListeners } = await import("@/modules/subscription/listeners");
    const { initPaymentListeners } = await import("@/modules/payment/listeners");
    const { initFinancialListeners } = await import("@/modules/financial/listeners");
    const { initPostListeners } = await import("@/modules/post/listeners");
    const { initMediaListeners } = await import("@/modules/media/listeners");
    const { initPageListeners } = await import("@/modules/page/listeners");
    
    // Init listeners module yang tidak berubah
    const { initAuthListeners } = await import("@/modules/auth/listeners");
    const { initCatalogListeners } = await import("@/modules/catalog/listeners");
    const { initOrderListeners } = await import("@/modules/order/listeners");
    
    await Promise.all([
      initSiteListeners(),
      initDomainListeners(),
      initNotificationListeners(),
      initSubscriptionListeners(),
      initPaymentListeners(),
      initFinancialListeners(),
      initPostListeners(),
      initMediaListeners(),
      initPageListeners(),
      initAuthListeners(),
      initCatalogListeners(),
      initOrderListeners(),
    ]);
    
    console.log("🚀 Sistem Event-Driven dengan 14 module berhasil diinisialisasi.");
  }
}
```

---

## 12. Tahapan Migrasi

### Prinsip: File Move, Not Rewrite

Setiap file yang dipindahkan **tidak boleh diubah isinya** (kecuali import path). Ini penting untuk:
1. Minimal risk — file yang sudah berfungsi tidak diotak-atik
2. Git history tetap jelas — file pindah, bukan baru
3. Review lebih mudah — diff hanya menunjukkan path berubah

### Phase 0: Persiapan (1 hari)

```
Task 0.1: Buat struktur folder kosong untuk 10 module baru
Task 0.2: Buat dependency-cruiser rules baru
Task 0.3: Buat event baru di event-types.ts
Task 0.4: Update tsconfig.json path aliases
```

### Phase 1: Pemecahan tenant → site + domain + notification + infrastructure (2 hari)

```
Task 1.1: Pindahkan file tenant → site
  - git mv src/modules/tenant/services/site.service.ts src/modules/site/services/
  - git mv src/modules/tenant/services/site-settings.service.ts src/modules/site/services/
  - ... (semua file site)

Task 1.2: Pindahkan file tenant → domain
  - git mv src/modules/tenant/services/domain.service.ts src/modules/domain/services/
  - git mv src/modules/tenant/controllers/domain.controller.ts src/modules/domain/controllers/
  - ...

Task 1.3: Pindahkan file tenant → notification
  - git mv src/modules/tenant/services/email.service.ts src/modules/notification/services/
  - ...

Task 1.4: Pindahkan file tenant → infrastructure
  - git mv src/modules/tenant/services/provisioning.service.ts src/modules/infrastructure/services/
  - ...

Task 1.5: Update listener references
  - site/listeners/index.ts → event lama di-export ulang dari site
  - notification/listeners/index.ts → pindah handler dari tenant/listeners

Task 1.6: Hapus tenant module
  - rm -rf src/modules/tenant/
```

**Verifikasi**: `bun run typecheck && bun run test:architecture && bun run build`

### Phase 2: Pemecahan billing → subscription + payment + financial (2 hari)

```
Task 2.1: Pindahkan file billing → subscription
  - plan.service, limit.service, platform.service
  - plan.repository, subscription.repository
  - PlansList, TrialBanner, FeaturesMatrix, AddonSlots

Task 2.2: Pindahkan file billing → payment
  - transaction.service, checkout.service, webhook.service
  - transaction.repository
  - PaymentConfirmation, PaymentMethodSelector

Task 2.3: Pindahkan file billing → financial
  - coupon.service, withdrawal.service, admin.service, settings.service
  - coupon.repository, billing.repository
  - CouponList, WithdrawalList, HistoryBillClient

Task 2.4: Pindahkan followup.service → notification
  - followup.service → notification/services/

Task 2.5: Update event contracts
  - billing.payment.completed → payment.completed
  - request.billing.checkLimit → request.subscription.checkLimit

Task 2.6: Hapus billing module
```

**Verifikasi**: `bun run typecheck && bun run test:architecture && bun run build`

### Phase 3: Pemecahan content → post + media + page (2 hari)

```
Task 3.1: Pindahkan file content → post
  - post.service, taxonomy.service, testimonial.service, search.service
  - taxonomy.repository
  - blog/ShareButtons

Task 3.2: Pindahkan file content → media
  - media.service, gallery.service, portfolio.service
  - media.repository
  - media/*, GallerySection

Task 3.3: Pindahkan file content → page
  - page.service, menu.service, content.service, content-display.service
  - page.repository, menu.repository, content.repository
  - credbuild/*, editor/*, pages/*

Task 3.4: Update event contracts
  - request.content.countPosts → request.post.countPosts
  - request.content.countTestimonials → request.post.countTestimonials
  - request.content.getMediaSize → request.media.getMediaSize

Task 3.5: Hapus content module
```

**Verifikasi**: `bun run typecheck && bun run test:architecture && bun run build`

### Phase 4: Cleanup & Final (1 hari)

```
Task 4.1: Hapus tenant/billing/content dari dependency-cruiser rules
Task 4.2: Hapus event lama yang sudah dual-run
Task 4.3: Hapus path aliases yang sudah tidak dipakai
Task 4.4: Final build + typecheck + architecture test
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

Setiap module baru harus punya test untuk:

```typescript
// subscription/listeners/__tests__/check-limit.test.ts
describe('Subscription Listeners', () => {
  it('should reply to request.subscription.checkLimit', async () => {});
  it('should return allowed=false when limit exceeded', async () => {});
});

// notification/listeners/__tests__/payment-completed.test.ts
describe('Notification Listeners', () => {
  it('should send WhatsApp on billing.payment.completed', async () => {});
  it('should send Email on billing.payment.completed', async () => {});
});
```

### 13.2 Integration Tests

```typescript
// tests/integration/module-splitting/payment-flow.test.ts
describe('Payment Flow setelah module split', () => {
  it('payment module publish payment.completed → notification subscribe', async () => {
    // 1. payment.publish('payment.completed')
    // 2. notification menerima event
    // 3. WhatsApp terkirim, Email terkirim
  });
  
  it('site module request subscription.checkLimit', async () => {
    // 1. site.eventBus.request('request.subscription.checkLimit')
    // 2. subscription reply
    // 3. site menerima response
  });
});
```

### 13.3 Rollback Strategy

Setiap phase bisa di-rollback dengan:

```bash
git revert <commit-hash> -m 1  # revert merge commit phase
```

Atau jika fase 1 sudah di-merge:

```bash
# Kembalikan file tenant dari backup
git checkout HEAD~1 -- src/modules/tenant/
git checkout HEAD~1 -- src/modules/site/  # hapus module baru
```

---

## Timeline Estimasi

| Phase | Isi | Durasi |
|-------|-----|--------|
| Phase 0 | Persiapan struktur | 0.5 hari |
| Phase 1 | tenant → 4 module | 2 hari |
| Phase 2 | billing → 3 module | 2 hari |
| Phase 3 | content → 3 module | 2 hari |
| Phase 4 | Cleanup akhir | 0.5 hari |
| **Total** | **10 module baru** | **~7 hari** |

Setiap phase harus lolos: ✅ typecheck ✅ dependency-cruiser ✅ unit tests ✅ build
