# API Migration Status - SitusBisnis

**Tanggal**: 18 Juni 2026
**Status**: Hampir Selesai (70/73 migrated)

---

## Daftar API Routes Lama vs Sudah Dimigrasi

| Keterangan:

- ✅ Sudah dimigrasi
- ❌ Belum dimigrasi

---

## 1. Admin API

| Route                            | Status | Keterangan                                                        |
| -------------------------------- | ------ | ----------------------------------------------------------------- |
| `/api/admin/backup`              | ✅     | GET/POST `admin/backup` via infra-api.controller                  |
| `/api/admin/coupons`             | ✅     | GET/POST `admin/coupons` via financial-api.controller             |
| `/api/admin/coupons/[id]`        | ✅     | PATCH `admin/coupons/*` via financial-api.controller              |
| `/api/admin/plans`               | ✅     | GET `admin/plans` via subscription-api.controller                 |
| `/api/admin/settings`            | ✅     | GET/PATCH `admin/settings` via site-api.controller                |
| `/api/admin/settings/ai-models`  | ✅     | POST `admin/settings/ai-models` via site-api.controller           |
| `/api/admin/sites/[id]`          | ✅     | GET/DELETE/PATCH `admin/sites/*` via site-api.controller          |
| `/api/admin/subscriptions/[id]`  | ✅     | GET/PATCH `admin/subscriptions/*` via subscription-api.controller |
| `/api/admin/transactions/update` | ✅     | POST `admin/transactions/update` via billing-api.controller       |
| `/api/admin/withdrawals/update`  | ✅     | POST `admin/withdrawals/update` via financial-api.controller      |

---

## 2. Affiliate API

| Route                     | Status | Keterangan                                        |
| ------------------------- | ------ | ------------------------------------------------- |
| `/api/affiliate/check`    | ✅     | GET `affiliate/check` via user-api.controller     |
| `/api/affiliate/withdraw` | ✅     | POST `affiliate/withdraw` via user-api.controller |

---

## 3. AI API

| Route                  | Status | Keterangan                                          |
| ---------------------- | ------ | --------------------------------------------------- |
| `/api/ai`              | ✅     | POST `ai` via ai-api.controller (standalone module) |
| `/api/ai/schemas.json` | ❌     | Static JSON di module ai, bukan route terpisah      |

---

## 4. Analytics API

| Route            | Status | Keterangan                                   |
| ---------------- | ------ | -------------------------------------------- |
| `/api/analytics` | ✅     | GET `site/analytics` via site-api.controller |

---

## 5. Auth API

| Route                     | Status | Keterangan                                       |
| ------------------------- | ------ | ------------------------------------------------ |
| `/api/auth/[...nextauth]` | ❌     | NextAuth catch-all, beda arsitektur              |
| `/api/auth/bridge`        | ✅     | GET `auth/bridge` via auth-api.controller        |
| `/api/auth/bridge/accept` | ✅     | GET `auth/bridge/accept` via auth-api.controller |
| `/api/auth/register`      | ✅     | POST `auth/register` via register.controller     |

---

## 6. Billing API (Subscription)

| Route                           | Status | Keterangan                                                       |
| ------------------------------- | ------ | ---------------------------------------------------------------- |
| `/api/billing/buy-slot`         | ✅     | POST `billing/buy-slot` via billing-api.controller               |
| `/api/billing/cancel`           | ✅     | POST `billing/cancel` via billing-api.controller                 |
| `/api/billing/check-status`     | ✅     | POST `billing/check-status` via billing-api.controller           |
| `/api/billing/checkout/payment` | ✅     | POST `billing/checkout/payment` via billing-api.controller       |
| `/api/billing/confirm`          | ✅     | POST `billing/confirm` via billing-api.controller                |
| `/api/billing/extend-trial`     | ✅     | POST `billing/extend-trial` via subscription-api.controller      |
| `/api/billing/payment-methods`  | ✅     | POST `billing/payment-methods` via billing-api.controller        |
| `/api/billing/simulate-duitku`  | ❌     | Belum diimplementasikan (dev tool)                               |
| `/api/billing/upgrade`          | ✅     | POST `billing/upgrade` via billing-api.controller                |
| `/api/billing/validate-coupon`  | ✅     | GET/POST `billing/validate-coupon` via financial-api.controller  |
| `/api/billing/webhook/duitku`   | ✅     | POST `payment/billing/webhook/duitku` via payment-api.controller |

---

## 7. Contact API

| Route          | Status | Keterangan                                      |
| -------------- | ------ | ----------------------------------------------- |
| `/api/contact` | ✅     | GET/POST `site/contact` via site-api.controller |

---

## 8. CredBuild API

| Route            | Status | Keterangan                                        |
| ---------------- | ------ | ------------------------------------------------- |
| `/api/credbuild` | ✅     | GET/POST `page/credbuild` via page-api.controller |

---

## 9. Domain API

| Route                 | Status | Keterangan                                      |
| --------------------- | ------ | ----------------------------------------------- |
| `/api/domains/verify` | ✅     | POST `domains/verify` via domain-api.controller |

---

## 10. Gallery API

| Route               | Status | Keterangan                                              |
| ------------------- | ------ | ------------------------------------------------------- |
| `/api/gallery`      | ✅     | GET/POST `media/gallery` via gallery CRUD               |
| `/api/gallery/[id]` | ✅     | GET/PUT/PATCH/DELETE `media/gallery/*` via gallery CRUD |

---

## 11. Health API

| Route         | Status | Keterangan                                |
| ------------- | ------ | ----------------------------------------- |
| `/api/health` | ✅     | GET `site/health` via site-api.controller |

---

## 12. Media API

| Route                     | Status | Keterangan                                        |
| ------------------------- | ------ | ------------------------------------------------- |
| `/api/media`              | ✅     | GET/POST `media` via media-api.controller         |
| `/api/media/[id]`         | ✅     | DELETE `media/*` via media-api.controller         |
| `/api/media/folders`      | ✅     | GET `media/folders` via media-api.controller      |
| `/api/media/folders/[id]` | ✅     | DELETE `media/folders/*` via media-api.controller |
| `/api/media/proxy`        | ✅     | GET `media/proxy` via media-api.controller        |

---

## 13. Menus API

| Route             | Status | Keterangan                                           |
| ----------------- | ------ | ---------------------------------------------------- |
| `/api/menus`      | ✅     | GET `page/menus` dan `menus` via page-api.controller |
| `/api/menus/[id]` | ✅     | PUT `menus/*` via page-api.controller                |

---

## 14. Onboarding API

| Route             | Status | Keterangan                                |
| ----------------- | ------ | ----------------------------------------- |
| `/api/onboarding` | ✅     | POST `onboarding` via site-api.controller |

---

## 15. OpenAPI API

| Route          | Status | Keterangan                                      |
| -------------- | ------ | ----------------------------------------------- |
| `/api/openapi` | ✅     | GET `shared/openapi` via openapi-api.controller |

---

## 16. Orders API

| Route                         | Status | Keterangan                                                   |
| ----------------------------- | ------ | ------------------------------------------------------------ |
| `/api/orders`                 | ✅     | GET `orders` via order-api.controller                        |
| `/api/orders/[id]`            | ✅     | GET/PATCH `orders/*` via order-api.controller                |
| `/api/orders/check-status`    | ✅     | POST `order/orders/check-status` via order-api.controller    |
| `/api/orders/payment`         | ✅     | POST `order/orders/payment` via order-api.controller         |
| `/api/orders/payment-methods` | ✅     | POST `order/orders/payment-methods` via order-api.controller |
| `/api/orders/webhook/duitku`  | ✅     | POST `order/orders/webhook/duitku` via order-api.controller  |

---

## 17. Pages API

| Route             | Status | Keterangan                                   |
| ----------------- | ------ | -------------------------------------------- |
| `/api/pages`      | ✅     | GET/POST `pages` via page-api.controller     |
| `/api/pages/[id]` | ✅     | GET/DELETE `pages/*` via page-api.controller |

---

## 18. Portfolios API

| Route                  | Status | Keterangan                                                   |
| ---------------------- | ------ | ------------------------------------------------------------ |
| `/api/portfolios`      | ✅     | GET/POST `media/portfolios` via portfolio CRUD               |
| `/api/portfolios/[id]` | ✅     | GET/PUT/PATCH/DELETE `media/portfolios/*` via portfolio CRUD |

---

## 19. Posts API

| Route             | Status | Keterangan                                        |
| ----------------- | ------ | ------------------------------------------------- |
| `/api/posts`      | ✅     | GET/POST `posts` via post CRUD                    |
| `/api/posts/[id]` | ✅     | GET/POST/PUT/PATCH/DELETE `posts/*` via post CRUD |

---

## 20. Products API

| Route                | Status | Keterangan                                         |
| -------------------- | ------ | -------------------------------------------------- |
| `/api/products`      | ✅     | GET/POST `products` via product CRUD               |
| `/api/products/[id]` | ✅     | GET/PUT/PATCH/DELETE `products/*` via product CRUD |

---

## 21. Profile API

| Route          | Status | Keterangan                            |
| -------------- | ------ | ------------------------------------- |
| `/api/profile` | ✅     | PUT `profile` via user-api.controller |

---

## 22. Search API

| Route         | Status | Keterangan                           |
| ------------- | ------ | ------------------------------------ |
| `/api/search` | ✅     | GET `search` via site-api.controller |

---

## 23. Settings API

| Route                    | Status | Keterangan                                                |
| ------------------------ | ------ | --------------------------------------------------------- |
| `/api/settings`          | ✅     | GET/PATCH `site/settings` via site-api.controller         |
| `/api/settings/payments` | ✅     | GET/POST `site/settings/payments` via site-api.controller |
| `/api/settings/validate` | ✅     | GET `settings/validate` via site-api.controller           |

---

## 24. Taxonomies API

| Route                                 | Status | Keterangan                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------------- |
| `/api/taxonomies`                     | ✅     | GET/POST `post/taxonomies` via taxonomy CRUD                         |
| `/api/taxonomies/[id]`                | ✅     | GET/PUT/PATCH/DELETE `post/taxonomies/*` via taxonomy CRUD           |
| `/api/taxonomies/[id]/terms`          | ✅     | GET/POST `post/taxonomies/*/terms` via post-api.controller           |
| `/api/taxonomies/[id]/terms/[termId]` | ✅     | PUT/PATCH/DELETE `post/taxonomies/*/terms/*` via post-api.controller |

---

## 25. Testimonials API

| Route                    | Status | Keterangan                                                      |
| ------------------------ | ------ | --------------------------------------------------------------- |
| `/api/testimonials`      | ✅     | GET/POST `post/testimonials` via testimonial CRUD               |
| `/api/testimonials/[id]` | ✅     | GET/PUT/PATCH/DELETE `post/testimonials/*` via testimonial CRUD |

---

## 26. User API

| Route                    | Status | Keterangan                                       |
| ------------------------ | ------ | ------------------------------------------------ |
| `/api/user/sites`        | ✅     | GET/PATCH `user/sites` via user-api.controller   |
| `/api/user/sites/verify` | ✅     | POST `user/sites/verify` via user-api.controller |

---

## 27. Users API

| Route             | Status | Keterangan                                     |
| ----------------- | ------ | ---------------------------------------------- |
| `/api/users`      | ✅     | GET/POST `users` via user-api.controller       |
| `/api/users/[id]` | ✅     | PATCH/DELETE `users/*` via user-api.controller |

---

## Ringkasan

| Kategori             | Jumlah | Sudah Dimigrasi | Belum Dimigrasi |
| -------------------- | ------ | --------------- | --------------- |
| **Total API Routes** | 73     | 70              | 3               |

### Belum Dimigrasi (3 intentionally not migrated)

1. `/api/ai/schemas.json` — Static JSON, bagian dari module ai
2. `/api/auth/[...nextauth]` — NextAuth native, beda arsitektur
3. `/api/billing/simulate-duitku` — Dev-only tool
