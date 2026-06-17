# Analisis Status Migrasi Modules — Update

**Tanggal:** 17 Juni 2026 (scan ulang)  
**Kondisi:** `src/app/api/` sudah dihapus total. Diganti `src/app/endpoints/[...route]/route.ts` + Server Actions.

---

## Gambaran Arsitektur Saat Ini

```
HTTP Request publik/eksternal
    ↓ next.config.js rewrite (8 rules tersisa)
    ↓
src/app/endpoints/
    ├── auth/[...nextauth]/route.ts       ← NextAuth OAuth
    └── [...route]/route.ts               ← Catch-all switch (HTTP controller)
            ↓
        src/modules/*/controllers/*-api.controller.ts
            ↓
        src/modules/*/services/*.service.ts

Browser (dashboard/admin) → Server Actions
    src/modules/*/actions/*.actions.ts
        ↓
    src/modules/*/services/*.service.ts
```

---

## Status per Modul

| Modul          | Actions                                          | API Controller                                          | Index/Client              |
| -------------- | ------------------------------------------------ | ------------------------------------------------------- | ------------------------- |
| auth           | ✅ `auth.actions.ts` (12 fungsi)                 | ✅ `auth-api.controller.ts` (bridge SSO)                | ✅ `IdentityClient`       |
| catalog        | ✅ `product.actions.ts` (4 fungsi)               | —                                                       | ✅ `CatalogClient`        |
| financial      | ✅ `financial.actions.ts` + `billing.actions.ts` | ✅ `financial.controller.ts`                            | ✅ `FinancialClient`      |
| infrastructure | ✅ `infra.actions.ts` (4 fungsi)                 | ✅ `provisioning.controller.ts`                         | ✅ `InfrastructureClient` |
| media          | ✅ `media.actions.ts` (11 fungsi)                | ✅ `media-api.controller.ts` (upload + proxy)           | ✅ `MediaClient`          |
| order          | ⚠️ `order.actions.ts` (1 fungsi saja)            | ✅ `order-api.controller.ts` (5 fungsi)                 | ✅ `OrderClient`          |
| page           | ✅ `page.actions.ts` (4 fungsi)                  | ✅ `page-api.controller.ts` (AI + credbuild)            | ✅ `PageClient`           |
| payment        | ✅ `payment.actions.ts` (5 fungsi)               | ✅ `payment-api.controller.ts` (webhook)                | ✅ `PaymentClient`        |
| post           | ✅ `post.actions.ts` (10 fungsi)                 | ✅ `post-api.controller.ts` (re-export testimonialApi)  | ✅ `PostClient`           |
| site           | ✅ `site.actions.ts` (3 fungsi)                  | ✅ `site-api.controller.ts` (settings, health, contact) | ✅ `SiteClient`           |
| subscription   | ✅ `subscription.actions.ts` (4 fungsi)          | ✅ `subscription-api.controller.ts` (cron)              | ✅ `SubscriptionClient`   |
| domain         | ❌ tidak ada actions                             | controllers hanya internal wrappers                     | ✅ `DomainClient`         |
| notification   | ❌ tidak ada actions                             | —                                                       | exports langsung          |
| crud           | ❌ tidak ada actions                             | `crud.controller.ts` (internal factory)                 | `CrudClient`              |
| shared         | —                                                | `openapi-api.controller.ts`                             | utilities                 |

---

## Masalah 1: Fetch Calls yang Masih Menghasilkan 404

`src/app/api/` sudah dihapus dan ada catch-all rewrite `/api/:path*` → `/endpoints/:path*`, tapi catch-all route hanya menangani route yang terdaftar di switch. Route berikut **tidak ada di switch → 404 aktif**:

| Fetch Call                           | Dipanggil Dari                                                                                   | Status |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ | ------ |
| `GET /api/media`                     | `dashboard/media/page.tsx`, `BillingClient.tsx`, `HistoryBillClient.tsx`, `MediaPickerField.tsx` | ❌ 404 |
| `GET /api/media/folders`             | `dashboard/media/page.tsx`                                                                       | ❌ 404 |
| `GET /api/taxonomies`                | `PostEditor.tsx`, `PostList.client.tsx`, `taxonomies/new/page.tsx`                               | ❌ 404 |
| `POST /api/taxonomies`               | `taxonomies/new/page.tsx`                                                                        | ❌ 404 |
| `GET /api/menus?slug=...`            | `Header.tsx`, `Footer.tsx`                                                                       | ❌ 404 |
| `PATCH/DELETE /api/portfolios/:id`   | `PortfolioEditor.tsx`, `PortfolioList.client.tsx`                                                | ❌ 404 |
| `GET /api/portfolios/:id`            | `portfolios/[id]/page.tsx`                                                                       | ❌ 404 |
| `PATCH/DELETE /api/testimonials/:id` | `TestimonialCard.tsx`, `testimonials/[id]/page.tsx`                                              | ❌ 404 |
| `POST /api/users`                    | `admin/users/UserList.tsx`                                                                       | ❌ 404 |
| `PATCH /api/orders/:id`              | `dashboard/orders/[orderId]/OrderStatusManager.tsx`                                              | ❌ 404 |

**Catatan:** `dashboard/media/page.tsx` sudah menggunakan `media.actions.ts` untuk list (baris 47), tapi masih menggunakan `fetch("/api/media")` POST untuk upload (baris 140) — yang ini masih ter-handle karena `case "media": return uploadMediaApi(req)` ada di POST switch.

---

## Masalah 2: Duplikasi Actions di payment vs financial

`payment.actions.ts` dan `financial/billing.actions.ts` menduplikasi 4 fungsi dengan nama sama:

| Fungsi                       | `payment/actions/payment.actions.ts`        | `financial/actions/billing.actions.ts`        |
| ---------------------------- | ------------------------------------------- | --------------------------------------------- |
| `cancelTransactionAction`    | ✅ ada (signature: `transactionId: string`) | ✅ ada (signature: `body: { transactionId }`) |
| `upgradePlanAction`          | ✅ ada                                      | ✅ ada                                        |
| `buySlotAction`              | ✅ ada                                      | ✅ ada                                        |
| `confirmManualPaymentAction` | ✅ ada                                      | ✅ ada                                        |

**Yang digunakan oleh komponen UI:**

- `HistoryBillClient.tsx` import dari `@/modules/financial` → pakai `billing.actions.ts`
- `TransactionList.tsx` import dari `@/modules/payment/actions/payment.actions` → pakai `payment.actions.ts`
- `BillingClient.tsx` masih `fetch("/api/billing/...")` → **tidak pakai actions sama sekali**

Ini redundan dan berisiko konflik — dua implementasi berbeda untuk operasi yang sama.

---

## Masalah 3: `order.actions.ts` Sangat Tidak Lengkap

Hanya punya 1 fungsi (`updateOrderFulfillmentAction`), sementara `order.controller.ts` punya 13 fungsi. Banyak operasi order dari dashboard masih belum punya Server Action:

- `OrderStatusManager.tsx` masih `fetch("/api/orders/:id")` untuk PATCH — tidak ter-handle di endpoint switch

---

## Masalah 4: `page.actions.ts` Tidak Lengkap

Hanya ada: `createPageAction`, `deletePageAction`, `updateMenuAction`, `getMenuAction`.  
Tidak ada: `updatePageAction`, `getPageAction` — padahal `dashboard/pages/[id]/page.tsx` butuh update page.

---

## Masalah 5: `site.actions.ts` Sangat Minimal (3 fungsi)

Hanya: `updateSiteSettingsAction`, `savePaymentSettingsAction`, `validateGtmAction`.  
`fetch("/api/settings")` GET dari `Header.tsx`, `Footer.tsx`, `DashboardShell.tsx`, `use-currency.ts`, `use-platform-settings.ts` **ter-handle** (lewat endpoint GET `site/settings`), tapi ini adalah pola yang seharusnya diganti dengan Server Component + Context — bukan fetch dari client.

---

## Masalah 6: fetch di Shared Module (Arsitektural)

6 komponen di `modules/shared/` memanggil `fetch("/api/settings")` dan `fetch("/api/menus")` dari client context:

```
modules/shared/hooks/use-currency.ts
modules/shared/hooks/use-platform-settings.ts
modules/shared/ui/dashboard/DashboardShell.tsx
modules/shared/ui/layout/Header.tsx
modules/shared/ui/layout/Footer.tsx
modules/shared/ui/ui/FloatingChat.tsx
```

Ini adalah debt arsitektural. Solusi yang benar: inject `siteSettings` dan `menus` sebagai props dari Server Component parent (layout), bukan fetch dari client.

---

## Endpoint Switch: Route yang Belum Ada tapi Dibutuhkan

Perlu ditambahkan ke `src/app/endpoints/[...route]/route.ts`:

```
GET  media                    → getMediaListApi()
GET  media/folders            → getMediaFoldersApi()
GET  post/taxonomies          → getTaxonomiesApi()
POST post/taxonomies          → createTaxonomyApi()
GET  page/menus               → getMenusApi()
GET  media/portfolios/:id     → getPortfolioApi()
PATCH/DELETE media/portfolios/:id → updatePortfolioApi() / deletePortfolioApi()
PATCH/DELETE post/testimonials/:id → updateTestimonialApi() / deleteTestimonialApi()
POST auth/users               → createUserApi()
PATCH order/orders/:id        → updateOrderFulfillmentApi()
```

**Atau** — migrasi komponen-komponen ini ke Server Actions (lebih baik untuk dashboard).

---

## Prioritas Aksi

### Immediate (bug aktif / 404):

1. Tambahkan GET `media` ke endpoint switch → `getMediaListApi()` di `media-api.controller.ts`
2. Tambahkan GET `media/folders` ke endpoint switch
3. Tambahkan GET/POST `post/taxonomies` ke endpoint switch
4. Tambahkan GET `page/menus` ke endpoint switch
5. Tambahkan PATCH `/order/orders/:id` ke endpoint switch (atau buat `updateOrderFulfillmentAction` dipanggil langsung)
6. Migrasi `PortfolioEditor.tsx` + `PortfolioList.client.tsx` → pakai `media.actions.ts`
7. Migrasi `TestimonialCard.tsx` + `testimonials/[id]/page.tsx` → pakai `post.actions.ts`
8. Migrasi `admin/users/UserList.tsx` → pakai `getUsersAction()` + `createUserAction()` dari `auth.actions.ts`

### Short-term (cleanup duplikasi):

9. Gabungkan `payment.actions.ts` ke dalam `financial/billing.actions.ts` — hapus duplikasi
10. Migrate `BillingClient.tsx` (8 fetch calls) ke `billing.actions.ts`

### Medium-term (arsitektural):

11. Buat `SiteSettingsContext` — inject dari layout server component, hapus `fetch("/api/settings")` dari 6 shared components
12. Lengkapi `page.actions.ts` dengan `updatePageAction`
13. Lengkapi `order.actions.ts` dengan actions yang relevan untuk dashboard
