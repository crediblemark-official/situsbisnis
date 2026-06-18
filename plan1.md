# Plan 1: Migrasi API Route → Modular Endpoint

## Prinsip

- **CRUD sederhana** (products, posts, gallery, portfolios, testimonials, taxonomies) → konfigurasi deklaratif di `modules/{module}/crud/{resource}.ts`, import langsung di routes.ts, skip controllers
- **Business logic kompleks** → `controllers/` (thin) → `services/` → `repositories/`
- **Semua resource lama dimasukkan ke module existing yang paling relevan**, tidak bikin module baru
- **Endpoint router** di `app/endpoints/routes.ts`: mapping path + method → handler module
- **TypeScript compile: ✅ CLEAN** (zero errors)

---

## ✅ Status Implementasi

| Modul          | File Baru                                                                                                                               | Status |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| auth           | `controllers/register.controller.ts`                                                                                                    | ✅     |
| auth           | `controllers/user-api.controller.ts` (profile, users, user/sites)                                                                       | ✅     |
| financial      | `controllers/financial-api.controller.ts` (coupons, validate, admin settings)                                                           | ✅     |
| infrastructure | `controllers/infra-api.controller.ts` (backup export/import)                                                                            | ✅     |
| domain         | `controllers/domain-api.controller.ts` (domain verify)                                                                                  | ✅     |
| payment        | `controllers/billing-api.controller.ts` (checkout, confirm, cancel, upgrade, buy-slot, payment-methods)                                 | ✅     |
| subscription   | `controllers/subscription-api.controller.ts` (plans, pricing, admin sub, cancel, extend trial)                                          | ✅     |
| post           | `controllers/post-api.controller.ts` (terms CRUD)                                                                                       | ✅     |
| media          | `controllers/media-api.controller.ts` + `deleteMediaApi`                                                                                | ✅     |
| page           | `controllers/page-api.controller.ts` + `getPagesApi`, `savePageApi`, `updateMenuApi`                                                    | ✅     |
| order          | `controllers/order-api.controller.ts` + `getOrdersApi`, `getOrderDetailApi`, `updateOrderApi`                                           | ✅     |
| site           | `controllers/site-api.controller.ts` + `postOnboardingApi`, `validateSettingApi`, `getAdminSettingsApi`, `getAdminSiteApi`, `searchApi` | ✅     |
| **routes.ts**  | Semua endpoint register ulang                                                                                                           | ✅     |

---

## Mapping Resource Lama → Module Tujuan

| Resource Lama                    | Module Tujuan             | Endpoint Path                                |
| -------------------------------- | ------------------------- | -------------------------------------------- |
| `auth/register`                  | auth                      | `POST auth/register`                         |
| `affiliate/check`                | auth (via IdentityClient) | — (internal)                                 |
| `affiliate/withdraw`             | auth (via IdentityClient) | — (internal)                                 |
| `admin/backup`                   | infrastructure            | `GET/POST admin/backup`                      |
| `admin/coupons`                  | financial                 | `GET/POST admin/coupons`                     |
| `admin/plans`                    | subscription              | `GET admin/plans`                            |
| `admin/settings`                 | site                      | `GET admin/settings`                         |
| `admin/sites/[id]`               | site                      | `GET admin/sites/*`                          |
| `admin/subscriptions/[id]`       | subscription              | `GET admin/subscriptions/*`                  |
| `admin/transactions/update`      | payment                   | — (internal via PaymentClient)               |
| `admin/withdrawals/update`       | financial                 | — (internal via FinancialClient)             |
| `billing/checkout/payment`       | payment                   | `POST billing/checkout/payment`              |
| `billing/confirm`                | payment                   | `POST billing/confirm`                       |
| `billing/cancel`                 | payment                   | `POST billing/cancel`                        |
| `billing/upgrade`                | payment                   | `POST billing/upgrade`                       |
| `billing/buy-slot`               | payment                   | `POST billing/buy-slot`                      |
| `billing/payment-methods`        | payment                   | `POST billing/payment-methods`               |
| `billing/validate-coupon`        | financial                 | `GET/POST billing/validate-coupon`           |
| `billing/extend-trial`           | subscription              | `POST billing/extend-trial`                  |
| `billing/webhook/duitku`         | payment                   | `POST payment/billing/webhook/duitku`        |
| `domains/verify`                 | domain                    | `POST domains/verify`                        |
| `onboarding`                     | site                      | `POST onboarding`                            |
| `search`                         | site (orchestrate post)   | `GET search`                                 |
| `profile`                        | auth                      | `PUT profile`                                |
| `user/sites`                     | auth                      | `GET/PATCH user/sites`                       |
| `users`                          | auth                      | `GET/POST users`                             |
| `settings/validate`              | site                      | `GET settings/validate`                      |
| `media/[id]` (DELETE)            | media                     | `DELETE media/*`                             |
| `menus/[id]` (PUT)               | page                      | `PUT menus/*`                                |
| `pages` (collection)             | page                      | `GET/POST pages`                             |
| `orders/[id]`                    | order                     | `GET/PATCH orders/*`                         |
| `orders` (list)                  | order                     | `GET orders`                                 |
| `taxonomies/[id]/terms`          | post                      | `GET/POST post/taxonomies/*/terms`           |
| `taxonomies/[id]/terms/[termId]` | post                      | `PUT/PATCH/DELETE post/taxonomies/*/terms/*` |
| `pricing/plans`                  | subscription              | `GET pricing/plans`                          |
| `subscription/cancel`            | subscription              | `POST subscription/cancel`                   |

---

## Ringkasan Endpoint Terdaftar di routes.ts

| Kategori                                                          | Jumlah                  |
| ----------------------------------------------------------------- | ----------------------- |
| Auth (register, bridge)                                           | 3                       |
| User / Profile / Sites                                            | 5                       |
| Media (list, upload, proxy, folders, gallery, portfolios, delete) | 10                      |
| Posts / Taxonomies / Testimonials (collection + detail CRUD)      | 18                      |
| Products (collection + detail CRUD)                               | 6                       |
| Pages (collection, detail, menus, credbuild, ai)                  | 8                       |
| Orders (create, detail, list, payment, webhook)                   | 8                       |
| Site / Settings / Contact / Onboarding / Search                   | 9                       |
| Domains                                                           | 1                       |
| Billing / Payment                                                 | 9                       |
| Subscription / Pricing                                            | 4                       |
| Admin (backup, coupons, plans, settings, sites)                   | 7                       |
| Shared (openapi)                                                  | 1                       |
| **Total**                                                         | **~89 endpoint routes** |

---

## Belum Termigrasi (Sengaja Dilewatkan)

| Resource                                | Alasan                                                   |
| --------------------------------------- | -------------------------------------------------------- |
| `affiliate/check`, `affiliate/withdraw` | Tidak perlu endpoint publik, sudah via actions/listeners |
| `admin/transactions/update`             | Internal, dipicu webhook                                 |
| `admin/withdrawals/update`              | Internal, dipicu webhook                                 |
| `admin/coupons/[id]`                    | Detail coupon bisa ditambah kemudian                     |
| `admin/settings/ai-models`              | Bisa ditambah ke site controller kemudian                |
| `media/folders/[id]`                    | Folder detail CRUD bisa ditambah kemudian                |
| `gallery/[id]`                          | Sudah via `media/gallery/*`                              |
| `domains/verify` (GET)                  | Hanya POST yg diimplementasi                             |
