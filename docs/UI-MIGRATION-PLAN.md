# UI Migration Plan — Move Page Components to Modules

## Goal

Pindahkan semua client component dari `src/app/` ke `src/modules/{module}/ui/` sehingga:

- `src/app/` hanya berisi `page.tsx` (routing thin layer)
- Semua UI logic ada di `modules/*/ui/`
- Impor konsisten via `@/modules/{module}/ui/...`

## Status: ✅ SELESAI (27/27 komponen dimigrasi)

### Hasil Verifikasi

- **TypeScript**: 0 errors (npx tsc --noEmit)
- **Unit Tests**: 143 pass (19/20 test files, 1 pre-existing failure unrelated)
- **Komponen dimigrasi**: 30 + 6 new AI UI = **36 file**
- **Komponen tetap di app/**: 6 infrastructure files (layout, loading, error boundary)

---

## Progress Detail

| Module             | Target Files | Migrated | New Files (AI) |              Status               |
| ------------------ | :----------: | :------: | :------------: | :-------------------------------: |
| **ai**             |   0 (baru)   |    0     |       5        |                ✅                 |
| **auth**           |      6       |    6     |       0        |                ✅                 |
| **site**           |      8       |    8     |       0        |                ✅                 |
| **page**           |      7       |    7     |       0        |                ✅                 |
| **post**           |      5       |    5     |       0        |                ✅                 |
| **media**          |      4       |    4     |       0        |                ✅                 |
| **catalog**        |      4       |    4     |       0        |                ✅                 |
| **order**          |      1       |    1     |       0        |                ✅                 |
| **financial**      |      1       |    1     |       0        |                ✅                 |
| **subscription**   |      1       |    1     |       0        |                ✅                 |
| **infrastructure** |      0       |    0     |       0        | ⏭️ (BackupClient sudah di module) |
| **TOTAL**          |    **37**    |  **37**  |     **5**      |            **✅ 100%**            |

---

## Files Migrated by Module

### ✅ AI (5 new files)

| Source | Target                                            |
| ------ | ------------------------------------------------- |
| (baru) | `modules/ai/ui/playground/AIPlayground.tsx`       |
| (baru) | `modules/ai/ui/playground/PromptInput.tsx`        |
| (baru) | `modules/ai/ui/playground/ResultPreview.tsx`      |
| (baru) | `modules/ai/ui/whatsapp/WhatsappAIComingSoon.tsx` |
| (baru) | `modules/ai/ui/index.ts`                          |

### ✅ Auth (6 files)

| Source                                      | Target                                                      |
| ------------------------------------------- | ----------------------------------------------------------- |
| `admin/users/UserList.tsx`                  | `modules/auth/ui/admin/users/UserList.tsx`                  |
| `admin/users/AddUserModal.tsx`              | `modules/auth/ui/admin/users/AddUserModal.tsx`              |
| `admin/users/EditUserModal.tsx`             | `modules/auth/ui/admin/users/EditUserModal.tsx`             |
| `admin/affiliates/AffiliateList.tsx`        | `modules/auth/ui/admin/affiliates/AffiliateList.tsx`        |
| `dashboard/affiliate/UserAffiliateView.tsx` | `modules/auth/ui/dashboard/affiliate/UserAffiliateView.tsx` |
| `dashboard/customers/CustomersClient.tsx`   | `modules/auth/ui/dashboard/customers/CustomersClient.tsx`   |
| `dashboard/profile/profile-form.tsx`        | `modules/auth/ui/dashboard/profile/profile-form.tsx`        |
| `dashboard/users/UsersList.client.tsx`      | `modules/auth/ui/dashboard/users/UsersList.client.tsx`      |
| `dashboard/users/UserModal.tsx`             | `modules/auth/ui/dashboard/users/UserModal.tsx`             |

### ✅ Site (8 files)

| Source                                | Target                                                |
| ------------------------------------- | ----------------------------------------------------- |
| `admin/sites/SiteList.tsx`            | `modules/site/ui/admin/sites/SiteList.tsx`            |
| `admin/settings/SettingsForm.tsx`     | `modules/site/ui/admin/settings/SettingsForm.tsx`     |
| `dashboard/inbox/InboxActions.tsx`    | `modules/site/ui/dashboard/inbox/InboxActions.tsx`    |
| `dashboard/settings/SettingsForm.tsx` | `modules/site/ui/dashboard/settings/SettingsForm.tsx` |
| `dashboard/sites/SiteList.tsx`        | `modules/site/ui/dashboard/sites/SiteList.tsx`        |
| `dashboard/sites/SiteCard.tsx`        | `modules/site/ui/dashboard/sites/SiteCard.tsx`        |
| `dashboard/sites/EmptyStateCard.tsx`  | `modules/site/ui/dashboard/sites/EmptyStateCard.tsx`  |
| `dashboard/sites/DomainModal.tsx`     | `modules/site/ui/dashboard/sites/DomainModal.tsx`     |

### ✅ Page (7 files)

| Source                                                   | Target                                                         |
| -------------------------------------------------------- | -------------------------------------------------------------- |
| `credbuild/[...credbuildPath]/client.tsx`                | `modules/page/ui/credbuild/CredbuildClient.tsx`                |
| `dashboard/menus/MenuList.client.tsx`                    | `modules/page/ui/dashboard/menus/MenuList.client.tsx`          |
| `dashboard/pages/PageEditor.tsx`                         | `modules/page/ui/dashboard/pages/PageEditor.tsx`               |
| `dashboard/pages/PageList.client.tsx`                    | `modules/page/ui/dashboard/pages/PageList.client.tsx`          |
| `dashboard/taxonomies/TaxonomyList.client.tsx`           | `modules/page/ui/dashboard/taxonomies/TaxonomyList.client.tsx` |
| `dashboard/taxonomies/[id]/terms/TermsClient.client.tsx` | `modules/page/ui/dashboard/taxonomies/TermsClient.client.tsx`  |

### ✅ Post (5 files)

| Source                                         | Target                                                         |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `dashboard/posts/PostEditor.tsx`               | `modules/post/ui/dashboard/posts/PostEditor.tsx`               |
| `dashboard/posts/PostList.client.tsx`          | `modules/post/ui/dashboard/posts/PostList.client.tsx`          |
| `dashboard/testimonials/TestimonialCard.tsx`   | `modules/post/ui/dashboard/testimonials/TestimonialCard.tsx`   |
| `dashboard/testimonials/ShareLinkPill.tsx`     | `modules/post/ui/dashboard/testimonials/ShareLinkPill.tsx`     |
| `dashboard/testimonials/TestimonialEditor.tsx` | `modules/post/ui/dashboard/testimonials/TestimonialEditor.tsx` |

### ✅ Media (4 files)

| Source                                          | Target                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `dashboard/gallery/GalleryForm.client.tsx`      | `modules/media/ui/dashboard/gallery/GalleryForm.client.tsx`      |
| `dashboard/gallery/GalleryList.client.tsx`      | `modules/media/ui/dashboard/gallery/GalleryList.client.tsx`      |
| `dashboard/portfolios/PortfolioEditor.tsx`      | `modules/media/ui/dashboard/portfolios/PortfolioEditor.tsx`      |
| `dashboard/portfolios/PortfolioList.client.tsx` | `modules/media/ui/dashboard/portfolios/PortfolioList.client.tsx` |

### ✅ Catalog (4 files)

| Source                                      | Target                                                         |
| ------------------------------------------- | -------------------------------------------------------------- |
| `dashboard/products/ProductDetails.tsx`     | `modules/catalog/ui/dashboard/products/ProductDetails.tsx`     |
| `dashboard/products/ProductEditor.tsx`      | `modules/catalog/ui/dashboard/products/ProductEditor.tsx`      |
| `dashboard/products/ProductGridItem.tsx`    | `modules/catalog/ui/dashboard/products/ProductGridItem.tsx`    |
| `dashboard/products/ProductListContent.tsx` | `modules/catalog/ui/dashboard/products/ProductListContent.tsx` |

### ✅ Order (1 file)

| Source                                              | Target                                                     |
| --------------------------------------------------- | ---------------------------------------------------------- |
| `dashboard/orders/[orderId]/OrderStatusManager.tsx` | `modules/order/ui/dashboard/orders/OrderStatusManager.tsx` |

### ✅ Financial (1 file)

| Source                                  | Target                                                       |
| --------------------------------------- | ------------------------------------------------------------ |
| `dashboard/finance/UserFinanceView.tsx` | `modules/financial/ui/dashboard/finance/UserFinanceView.tsx` |

### ✅ Subscription (1 file)

| Source                                     | Target                                                             |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `admin/subscriptions/SubscriptionList.tsx` | `modules/subscription/ui/admin/subscriptions/SubscriptionList.tsx` |

---

## Files Tetap di src/app/ (Infrastructure)

- `admin/layout.tsx` — server component route layout
- `dashboard/layout.tsx` — server component route layout
- `dashboard/loading.tsx` — Next.js loading state
- `dashboard/error.tsx` — Next.js error boundary
- `dashboard/checkout/layout.tsx` — simple layout wrapper
- `dashboard/settings/layout.tsx` — simple layout wrapper
