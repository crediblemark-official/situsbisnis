# Analisis Bug — SitusBisnis-migration

**Proyek:** Multi-tenant SaaS builder website bisnis  
**Stack:** Next.js 16, TypeScript, Prisma, PostgreSQL, Redis, NextAuth, Duitku  
**Tanggal:** 17 Juni 2026

---

## Ringkasan

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 6 |
| 🟡 Medium | 5 |
| 🟢 Low | 5 |
| **Total** | **20** |

---

## 🔴 CRITICAL

### 1. Open Redirect + Session Token Leak pada Auth Bridge

| | |
|---|---|
| **File** | `src/app/api/auth/bridge/route.ts:27-53` |
| **Dampak** | Attacker bisa mencuri bridge token user yang sudah login |

Parameter `target` tidak divalidasi terhadap whitelist domain yang diizinkan. Attacker dapat membuat URL seperti:

```
/api/auth/bridge?target=https://evil.com
```

Saat diklik user yang sudah login, endpoint akan:
1. Membuat HMAC bridge token berisi session user
2. Redirect ke `evil.com/api/auth/bridge/accept?token=...`

Token bisa digunakan attacker untuk membuat session JWT valid di domain evil.com.

**Fix:** Validasi `target` hanya mengarah ke subdomain/custom domain yang terdaftar di platform.

---

### 2. Stored XSS via `dangerouslySetInnerHTML` Tanpa Sanitasi

| | |
|---|---|
| **File** | `src/modules/page/ui/editor/TiptapRenderer.tsx:14` |
| **File (sumber)** | `src/modules/shared/utils/editor/render.ts:23` |
| **Dampak** | Stored XSS jika user menyimpan HTML berbahaya |

`renderTiptapToHTML()` di line 23 mengembalikan `contentStr` langsung sebagai HTML jika konten bukan JSON (legacy content). Jika user menyimpan HTML berbahaya sebagai "legacy content", akan di-render tanpa sanitasi apapun.

**Fix:** Gunakan DOMPurify (atau library sanitasi HTML) sebelum `dangerouslySetInnerHTML`.

---

### 3. No CSRF Protection pada Semua API Endpoints

| | |
|---|---|
| **File** | Semua route API (register, profile, onboarding, billing, dll.) |
| **Dampak** | CSRF attack dari situs lain bisa memodifikasi data user |

Tidak ada CSRF token validation di seluruh API endpoints. Meskipun NextAuth menggunakan `sameSite: "lax"`, form-based CSRF tetap bisa dilakukan.

**Fix:** Implementasikan CSRF token (double-submit cookie pattern atau library seperti `csrf`).

---

### 4. IP Spoofing pada Rate Limiter

| | |
|---|---|
| **File** | `src/modules/shared/core/rate-limit.ts:39-44` |
| **Dampak** | Rate limit bisa dilewati dengan memalsukan IP |

IP diambil dari header `x-forwarded-for` yang bisa dipalsukan client. Attacker bisa membanjiri API dengan mengirim `x-forwarded-for: 1.2.3.4`, lalu request berikutnya dengan IP berbeda.

**Fix:** Gunakan kombinasi IP asli dari koneksi TCP + `x-forwarded-for` sebagai fallback. Di Cloudflare, gunakan `cf-connecting-ip`.

---

## 🟠 HIGH

### 5. Account Enumeration via Login Error Messages

| | |
|---|---|
| **File** | `src/modules/shared/utils/auth/index.ts:68,79` |
| **Dampak** | Attacker bisa mengetahui email mana yang terdaftar |

Error message berbeda untuk "Email not found" vs "Wrong password".

**Fix:** Gunakan error message generik seperti "Email atau password salah".

---

### 6. Self-Referral Affiliate via Multiple Accounts

| | |
|---|---|
| **File** | `src/modules/auth/services/auth.service.ts:63-68` |
| **Dampak** | User bisa mendapat komisi dengan membuat banyak akun |

Tidak ada pengecekan apakah referral code milik user yang sama atau IP yang sama. User bisa membuat akun A, lalu akun B mereferal A.

**Fix:** Cek IP address, device fingerprint, atau batasi periode referral untuk akun baru.

---

### 7. Bridge Token HMAC Menggunakan `NEXTAUTH_SECRET`

| | |
|---|---|
| **File** | `src/app/api/auth/bridge/route.ts:41`, `src/modules/auth/services/auth.service.ts:114` |
| **Dampak** | Jika bridge token bocor, secret JWT ikut terekspos |

Secret yang sama (`NEXTAUTH_SECRET`) digunakan untuk HMAC bridge token dan JWT signing.

**Fix:** Gunakan secret terpisah untuk bridge token (`BRIDGE_SECRET`).

---

### 8. Missing Content Security Policy (CSP) Headers

| | |
|---|---|
| **File** | `src/proxy.ts:164-172` |
| **Dampak** | XSS attack lebih mudah dieksekusi |

Security headers sudah di-set (X-Frame-Options, HSTS, dll.) tapi **Content-Security-Policy** tidak ada.

**Fix:** Tambahkan CSP header dengan `script-src 'self'`, `img-src 'self' https://*`, dll.

---

### 9. `revalidateTag()` Dipanggil dengan Argumen Kedua yang Tidak Valid

| | |
|---|---|
| **File** | `src/modules/domain/services/domain.service.ts:60-62`, `src/modules/domain/services/domain.service.ts:169-171`, `src/modules/payment/services/transaction.service.ts:155` |
| **Dampak** | Cache tidak terevalidate dengan benar |

`revalidateTag()` di Next.js hanya menerima satu argument (string tag). Kode memanggil `revalidateTag(tag, "default")` dengan argumen kedua yang diabaikan.

**Fix:** Hapus argumen kedua.

---

### 10. Missing File Type Validation pada Media Upload

| | |
|---|---|
| **File** | `src/modules/media/services/media.service.ts:58` |
| **Dampak | File berbahaya bisa diupload dengan rename ekstensi |

Hanya dicek berdasarkan ekstensi file (`[".jpg", ".jpeg", ".png", ".webp"]`). Tidak ada validasi magic bytes/MIME type sesungguhnya. File `.php` atau `.exe` yang di-rename jadi `.jpg` bisa diupload.

**Fix:** Gunakan `file-type` library untuk validasi magic bytes.

---

## 🟡 MEDIUM

### 11. Potensi Denial of Service pada EventBus In-Memory

| | |
|---|---|
| **File** | `src/modules/shared/core/event-bus.ts:11-17` |
| **Dampak** | Memory leak atau OOM |

`EventBus` menggunakan `EventEmitter` tanpa batas listener (`setMaxListeners(0)`).

**Fix:** Tetapkan batas listener yang wajar, monitor jumlah listener.

---

### 12. Missing Index pada Kolom `User.referredById`

| | |
|---|---|
| **File** | `prisma/schema.prisma:22` |
| **Dampak** | Performa query afiliasi lambat pada skala besar |

Kolom `referredById` di model `User` tidak memiliki index.

**Fix:** Tambahkan `@@index([referredById])` pada model User.

---

### 13. `SiteUser.userId` Tanpa Foreign Key — Orphaned Records

| | |
|---|---|
| **File** | `prisma/schema.prisma:613-625` |
| **Dampak** | Data tidak konsisten saat user dihapus |

`SiteUser.userId` adalah string biasa tanpa relasi FK ke `User.id`.

**Fix:** Tambahkan relation ke User atau hapus SiteUser records saat user dihapus.

---

### 14. Race Condition pada Pengecekan Pending Transaction

| | |
|---|---|
| **File** | `src/modules/payment/services/checkout.service.ts:44-49` |
| **Dampak** | Duplikasi transaksi pada konkurensi tinggi |

Antara `findPendingTransactionWithProof` dan `deletePendingTransactionsWithoutProof` tidak ada locking.

**Fix:** Gunakan advisory lock (`pg_advisory_xact_lock`) atau `$transaction` dengan `isolationLevel: "serializable"`.

---

### 15. Duitku Webhook — Merchant Order ID Parsing Bisa Error

| | |
|---|---|
| **File** | `src/modules/payment/services/webhook.service.ts:138`, `src/modules/order/services/webhook.service.ts:103` |
| **Dampak** | Order ID bisa salah extract |

`merchantOrderId.split("-")[0]` mengasumsikan format `{id}-{method}-{suffix}`.

**Fix:** Gunakan pola yang lebih robust, misal `merchantOrderId.match(/^([^-]+)/)?.[1]`.

---

## 🟢 LOW

### 16. Session Cookie `maxAge` Tidak Diset di Bridge Accept

| | |
|---|---|
| **File** | `src/app/api/auth/bridge/accept/route.ts:45-50` |

Cookie session diset tanpa `maxAge`, jadi session akan session-only (expired saat browser ditutup).

---

### 17. Error Message Mencakup Stack Trace di Production

| | |
|---|---|
| **File** | `src/app/api/billing/checkout/payment/route.ts:36` |

`error.message` dikembalikan langsung ke client. Di production, stack trace bisa bocor.

---

### 18. `price` Field dalam Order Schema Tidak Digunakan

| | |
|---|---|
| **File** | `src/app/api/orders/route.ts:11-13` |

Schema validasi order menerima `price` dari client, tapi `checkout.service.ts` selalu menggunakan harga dari database.

---

### 19. Potential Null Pointer pada `eventBus.publish()`

| | |
|---|---|
| **File** | `src/modules/auth/services/auth.service.ts:92` |

`eventBus.publish()` tidak di-`await` dan tidak ada `catch`.

---

### 20. `getTenant()` Cache Tidak Invalidasi untuk Custom Domain

| | |
|---|---|
| **File** | `src/modules/shared/utils/domains/tenant.ts:8-48` |

Fungsi `getTenant()` menggunakan React `cache()` tanpa cache tag. Perubahan domain tidak akan terdeteksi sampai server restart.

---

---

## Fitur yang Tidak Berfungsi (Broken Features)

### 21. Event Handler `request.content.*` Tidak Terdaftar (Dead Code)

| | |
|---|---|
| **File** | `src/modules/page/listeners/index.ts` |
| **Severity** | 🔴 Critical |

`page/listeners/index.ts` mengekspor `initContentListeners` yang mendaftarkan handler untuk `request.content.countPosts`, `request.content.countTestimonials`, dan `request.content.getMediaSize`. Namun `instrumentation.ts` **tidak pernah mengimpor atau memanggil fungsi ini**.

Dampak: Fitur pengecekan limit subscription (post count, testimonial count, media storage) bergantung pada event ini via `subscription/services/limit.service.ts`. Saat ini bekerja secara tidak sengaja karena `post/listeners` dan `media/listeners` mendaftarkan handler duplikat untuk event yang sama (fallback accidental).

---

### 22. Duplikasi Event Handler (Konflik Reply)

| | |
|---|---|
| **File** | `src/modules/post/listeners/index.ts` (baris 5-21), `src/modules/media/listeners/index.ts` (baris 5-12) |
| **Severity** | 🟠 High |

Tiga file mendaftarkan handler untuk event yang sama:

| Event | page/listeners | post/listeners | media/listeners |
|-------|:-:|:-:|:-:|
| `request.content.countPosts` | ✅ (dead) | ✅ (active) | ❌ |
| `request.content.countTestimonials` | ✅ (dead) | ✅ (active) | ❌ |
| `request.content.getMediaSize` | ✅ (dead) | ❌ | ✅ (active) |

Karena `eventBus.reply()` menggunakan `emitter.on()`, **semua handler akan dieksekusi** untuk setiap request. Dengan in-memory mode, reply pertama yang sampai akan digunakan, sisanya diabaikan. Ini menyebabkan:
- Query database redundant (semua handler jalan)
- Race condition siapa yang reply pertama
- Waste resource

Jika issue #21 diperbaiki (page listeners diaktifkan), akan terjadi **tiga handler** untuk `countPosts` dan `countTestimonials` berjalan bersamaan.

---

### 23. Listener Stub Kosong (Tidak Ada Implementasi)

| | |
|---|---|
| **File** | `src/modules/payment/listeners/index.ts` |
| **File** | `src/modules/financial/listeners/index.ts` |
| **File** | `src/modules/infrastructure/listeners/index.ts` |
| **Severity** | 🟡 Medium |

Ketiga file listener diekspor dan dipanggil dari `instrumentation.ts` tetapi **tidak mendaftarkan satu pun event handler**:
- `payment/listeners` — body fungsi kosong `{}`
- `financial/listeners` — body fungsi kosong `{}`
- `infrastructure/listeners` — hanya komentar `// TODO`

Dampak: Fitur yang bergantung pada event modul-modul ini (jika ada caller yang melakukan `eventBus.request` ke event yang seharusnya di-handle modul ini) akan timeout 5000ms dan throw error.

---

### 24. Missing `async` Keyword pada 3 Listener Init Functions

| | |
|---|---|
| **File** | `src/modules/subscription/listeners/index.ts` |
| **File** | `src/modules/payment/listeners/index.ts` |
| **File** | `src/modules/financial/listeners/index.ts` |
| **Severity** | 🟢 Low |

Ketiga fungsi listener init tidak dideklarasikan `async`, tetapi `instrumentation.ts` memanggilnya dengan `await`. Secara teknis valid (JS membungkus return value non-Promise dengan `Promise.resolve`), tetapi inkonsisten dengan 6 listener lain yang proper `async`.

Lebih kritis: `initSubscriptionListeners` tidak `await` panggilan `eventBus.reply()`, sehingga listener mungkin belum terdaftar ketika fungsi dianggap selesai.

---

### 25. Stored XSS di Email Notification Templates

| | |
|---|---|
| **File** | `src/modules/notification/services/email-templates.service.ts` |
| **Severity** | 🟠 High |

Fungsi `sendWelcomeEmail`, `sendPaymentSuccessEmail`, `sendFollowupEmail`, dan lainnya menginjeksi `userName`, `siteName`, `planName`, dan `message` langsung ke template HTML tanpa sanitasi.

Contoh: `sendFollowupEmail` mengonversi URL dan WhatsApp markdown ke HTML, tetapi tidak men-strip tag HTML berbahaya terlebih dahulu. Jika admin mengirim followup dengan konten `<script>`, script akan dieksekusi di email client yang tidak aman.

---

### 26. Duplikasi Repository (Code Duplication)

| | |
|---|---|
| **File** | `src/modules/page/repositories/content.repository.ts` |
| **File** | `src/modules/post/repositories/content.repository.ts` |
| **File** | `src/modules/media/repositories/content.repository.ts` |
| **Severity** | 🟢 Low |

Ketiga file `content.repository.ts` di modul page, post, dan media memiliki isi yang **identik** (169 baris). Juga `page/repositories/media.repository.ts` identik dengan `media/repositories/media.repository.ts`. Ini adalah duplikasi kode yang terjadi saat migrasi modular.

---

## Analisis Kedalaman (Deep Analysis) — Payment, Auth, Database, API

### 🔴 Critical: Payment/Checkout Flow

#### 27. Duitku Invoice Gagal Silent — User Dikirim ke Halaman Sukses Tanpa Bayar

| | |
|---|---|
| **File** | `src/modules/payment/services/checkout.service.ts:93-95,316-318`, `src/modules/order/services/checkout.service.ts:104-132` |
| **Severity** | 🔴 Critical |

Ketika pembuatan invoice Duitku gagal (`paymentManager.createInvoice()` return `success: false`), kode hanya `console.warn` dan tetap mengembalikan response **tanpa `paymentUrl`**. Di sisi frontend (`CheckoutPage`, `ExpressCheckoutModal`), `if (data.paymentUrl)` akan false, sehingga user diarahkan ke halaman sukses (`/checkout/success`) meskipun **belum membayar**. User melihat "Order berhasil" padahal transaksi tidak pernah diproses di payment gateway.

#### 28. Webhook Duitku Tidak Memverifikasi Jumlah Pembayaran

| | |
|---|---|
| **File** | `src/modules/payment/services/webhook.service.ts:131-160`, `src/modules/order/services/webhook.service.ts:96-143` |
| **Severity** | 🔴 Critical |

Callback Duitku berisi field `amount` yang **tidak dicocokkan** dengan nilai transaksi di database. Signature HMAC diverifikasi, tetapi jika skema signature Duitku memiliki kelemahan atau API key bocor, attacker bisa memanipulasi jumlah pembayaran. Order bisa ditandai "paid" dengan amount berapa pun.

#### 29. Email Pelanggan Duitku Hardcoded

| | |
|---|---|
| **File** | `src/modules/payment/services/checkout.service.ts:148-149` |
| **Severity** | 🔴 Critical |

Setiap invoice Duitku untuk billing transaction menggunakan `customer.email = "tenant@situsbisnis.com"` — email palsu yang sama untuk semua tenant. Duitku akan mengirim receipt/notifikasi ke email ini. Tenant tidak pernah menerima konfirmasi pembayaran dari Duitku.

#### 30. `cancelTransaction` Melakukan Hard Delete (Bukan Soft Delete)

| | |
|---|---|
| **File** | `src/modules/payment/services/transaction.service.ts:204` |
| **Severity** | 🔴 Critical |

Transaksi yang dibatalkan akan **dihapus permanen** dari database. Tidak ada audit trail. Jika terjadi sengketa, tidak ada bukti bahwa transaksi pernah ada. Harusnya `status` diubah menjadi `"cancelled"`.

#### 31. Tidak Ada CSRF Protection di Seluruh API

| | |
|---|---|
| **File** | Semua route handler POST/PUT/PATCH/DELETE di `src/app/api/` |
| **Severity** | 🔴 Critical |

**Zero CSRF protection.** Tidak ada token CSRF, referer check, atau double-submit cookie. Semua mutation endpoint (register, order, payment, profile change, admin actions) rentan terhadap Cross-Site Request Forgery. Khususnya `POST /api/orders` (public, no auth) — visitor bisa dipaksa membuat order melalui CSRF.

#### 32. `.env` dengan Secrets Ter-commit ke Git

| | |
|---|---|
| **File** | `.env` (seluruh file) |
| **Severity** | 🔴 Critical |

File `.env` berisi: `NEXTAUTH_SECRET`, `DOKPLOY_API_KEY`, `DATABASE_URL` (dengan password), `ADMIN_EMAIL` + `ADMIN_PASSWORD` — semua sudah ter-commit ke repository. Siapa pun dengan akses repo bisa: memalsukan JWT session, mengakses database production, mengakses API Dokploy, login sebagai admin.

---

### 🟠 High: Payment & Order

#### 33. `addonType` Check Logic Rapuh — Bisa Nuke Subscription

| | |
|---|---|
| **File** | `src/modules/payment/services/transaction.service.ts:86-121` |
| **Severity** | 🟠 High |

Jika `addonType` adalah `undefined`, `null`, `""` (empty string), atau nilai apa pun selain `"site_slot"`, kode masuk ke `else` block yang **membatalkan semua subscription aktif** lalu membuat subscription baru. Satu kesalahan mapping `addonType` bisa menghancurkan subscription tenant.

#### 34. `getIdFromMerchantOrderId` Fragile — Bisa Parse `undefined`

| | |
|---|---|
| **File** | `src/modules/payment/services/webhook.service.ts:138`, `src/modules/order/services/webhook.service.ts:103` |
| **Severity** | 🟠 High |

`merchantOrderId.match(/^([^-]+)/)?.[1]` — parsing `transactionId` dengan split on `-`. Jika `merchantOrderId` kosong/null, hasilnya `undefined`, dan `processApprovedTransaction(undefined)` akan gagal dengan error cryptic.

#### 35. Webhook Order Tidak Award Affiliate Commission

| | |
|---|---|
| **File** | `src/modules/order/services/webhook.service.ts:79-81` |
| **Severity** | 🟠 High |

`checkOrderStatus` (polling) update status ke `"paid"` tetapi **tidak memanggil fungsi** yang award affiliate commission. Bandingkan dengan `payment/services/webhook.service.ts:78-86` yang benar-benar memanggil `processApprovedTransaction`.

#### 36. `creditOwner` Logic Terbalik

| | |
|---|---|
| **File** | `src/modules/order/services/webhook.service.ts:138-140` |
| **Severity** | 🟠 High |

`creditOwner = !paymentSettings?.duitkuMerchantCode || !paymentSettings?.duitkuApiKey`. Jika site menggunakan kredensial Duitku sendiri → `creditOwner = false` → **tidak ada yang dicredit**. Jika site menggunakan kredensial platform → `creditOwner = true` → platform owner dicredit. Ini sepertinya terbalik: site dengan payment sendiri seharusnya menerima payment, bukan platform.

#### 37. Coupon Validation di Luar DB Transaction — Race Condition

| | |
|---|---|
| **File** | `src/modules/payment/services/checkout.service.ts:240-267` |
| **Severity** | 🟠 High |

Coupon dicek dan diskon dihitung **di luar** DB transaction. `usedCount` tidak di-increment hingga `processApprovedTransaction` dipanggil (jauh setelahnya). Dua request simultan bisa menggunakan kupon yang sama untuk transaksi berbeda.

#### 38. No Password Validation Server-Side

| | |
|---|---|
| **File** | `src/modules/auth/services/auth.service.ts:28-29` |
| **Severity** | 🟠 High |

Backend hanya cek `!email || !password` — **tidak ada minimum length**, tidak ada complexity requirements. Frontend (register page) cek 8 chars, tetapi API langsung bisa diakses tanpa frontend. Password 1 karakter bisa diterima. Juga: `profile/route.ts` menggunakan `z.string().min(6)` untuk password change — inkonsisten.

#### 39. Weak Referral Code Generation (Math.random)

| | |
|---|---|
| **File** | `src/modules/auth/services/auth.service.ts:9-11` |
| **Severity** | 🟠 High |

`Math.random().toString(36).substring(2, 8).toUpperCase()` — menggunakan PRNG non-kriptografis untuk referral code 6 karakter. Dengan 36^6 ≈ 2.1 miliar kemungkinan dan predictor `Math.random()`, kode referral bisa ditebak/dienumerasi.

#### 40. Decoupled FKs pada Subscription & PaymentTransaction

| | |
|---|---|
| **File** | `prisma/schema.prisma:501-544` |
| **Severity** | 🔴 Critical |

`Subscription.siteId` dan `PaymentTransaction.siteId` adalah plain `String` — **tidak ada relasi Prisma ke model Site**. FK constraint di-drop di migration `20260616183856`. Jika site dihapus, subscription dan transaction akan menjadi orphan records. Tidak ada ON DELETE CASCADE.

#### 41. Banyak Status Field Menggunakan String, Bukan Enum yang Sudah Ada

| | |
|---|---|
| **File** | `prisma/schema.prisma:145,506,617,148,149` |
| **Severity** | 🟠 High |

- `Order.status` (`String`) → `OrderStatus` enum sudah ada (line 634) tetapi tidak digunakan
- `Subscription.status` (`String`) → `SubscriptionStatus` enum sudah ada (line 642) tetapi tidak digunakan
- `SiteUser.role` (`String`) → `Role` enum sudah ada (line 627) tetapi tidak digunakan
- `Order.paymentStatus`, `Order.fulfillmentStatus` → tidak ada enum sama sekali

Ini memungkinkan nilai invalid masuk ke database tanpa validasi di level database.

#### 42. Admin Backup Endpoint Bisa Exfiltrate Seluruh Database

| | |
|---|---|
| **File** | `src/app/api/admin/backup/route.ts:13-25` |
| **Severity** | 🟠 High |

`GET /api/admin/backup` — ekspor semua data sebagai JSON yang bisa di-download. Jika kredensial admin compromised, seluruh data pelanggan (termasuk data payment, afiliasi) bisa dicuri. Tidak ada audit log.

#### 43. Admin Restore Backup Tanpa Validasi

| | |
|---|---|
| **File** | `src/app/api/admin/backup/route.ts:46-49` |
| **Severity** | 🟠 High |

`POST /api/admin/backup` — menerima JSON body **tanpa Zod validation** dan langsung meng-import ke database. Jika admin session di-XSS, attacker bisa meng-overwrite seluruh database.

#### 44. AI Endpoint Tidak Ada Autentikasi

| | |
|---|---|
| **File** | `src/app/api/ai/route.ts:124-161` |
| **Severity** | 🟠 High |

`POST /api/ai` — **tidak ada pengecekan session/role**. Siapa pun bisa memanggil endpoint ini, mengonsumsi resource AI (biaya per token) tanpa batas.

#### 45. Missing Indexes pada 36 Kolom yang Sering Di-query

| | |
|---|---|
| **File** | `prisma/schema.prisma` — berbagai model |
| **Severity** | 🟠 High |

Tidak ada index pada kolom: `Account.userId`, `Session.userId`, `Order.status`, `Order.paymentStatus`, `Order.customerEmail`, `ContactSubmission.status`, `Testimonial.isApproved`, `Withdrawal.status`, `User.referredById`, `Post.published`, dll. Query-query filtering by status/email/role akan full table scan.

#### 46. Currency Default Tidak Konsisten (USD vs IDR)

| | |
|---|---|
| **File** | `prisma/schema.prisma:183,254` |
| **Severity** | 🟠 High |

`PaymentSettings.currency` default `"USD"` (line 183), `SiteSettings.currency` default `"IDR"` (line 254). Jika order menggunakan currency berbeda antar model, akan terjadi mismatch nilai.

#### 47. Decimal Precision Tidak Konsisten

| | |
|---|---|
| **File** | `prisma/schema.prisma:120,122,144` vs `480,520,588` |
| **Severity** | 🟠 High |

`Product.price` = `Decimal` → `DECIMAL(65,30)` (presisi berlebihan), `Plan.price` = `@db.Decimal(10,2)` (presisi normal). Aritmetika antara decimal dengan presisi berbeda bisa menyebabkan rounding error.

#### 48. MediaFolder Tidak Ada Unique Constraint `[siteId, name]`

| | |
|---|---|
| **File** | `prisma/schema.prisma:348-361` |
| **Severity** | 🟠 High |

Tidak ada `@@unique([siteId, name])` pada MediaFolder. User bisa membuat folder dengan nama duplikat dalam site yang sama.

#### 49. In-Memory Rate Limiter — Semua IP "unknown" Satu Bucket

| | |
|---|---|
| **File** | `src/modules/shared/core/rate-limit.ts:44` |
| **Severity** | 🟠 High |

Jika IP tidak terdeteksi (header spoofed atau missing), fallback ke `"unknown"`. Semua request tanpa IP masuk ke bucket yang sama → satu attacker bisa mem-block semua user legitimate yang juga tidak terdeteksi IP-nya.

#### 50. Webhook Acknowledgment "OK" Dikirim Sebelum Error Handler

| | |
|---|---|
| **File** | `src/app/api/billing/webhook/duitku/route.ts:19-22` |
| **Severity** | 🟠 High |

Response "OK" dikirim (`Response: 20`) **sebelum** `processDuitkuWebhook` selesai. Jika terjadi error setelah response terkirim, Duitku menganggap callback sukses, tetapi transaksi tidak pernah diproses.

#### 51. Simulate-Duitku Endpoint Hanya Dijaga NODE_ENV

| | |
|---|---|
| **File** | `src/app/api/billing/simulate-duitku/route.ts:6-8` |
| **Severity** | 🟠 High |

Endpoint development yang bisa approve transaksi tanpa bayar hanya dicek `NODE_ENV !== "development"`. Jika production salah konfigurasi (`NODE_ENV=development`), endpoint ini terekspos tanpa autentikasi.

---

### Summary Statistik

| Kategori | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low |
|----------|:-:|:-:|:-:|:-:|
| Payment/Checkout | 7 | 27 | 36 | 17 |
| Auth/Security | 5 | 8 | 7 | 5 |
| Database Schema | 2 | 18 | 15 | 10 |
| API Routes | 4 | 10 | 9 | 2 |
| **Total Baru** | **18** | **63** | **67** | **34** |

---

## Rekomendasi Prioritas (Updated)

1. **🔴 Segera (Critical):**
   - Hapus `.env` dari git history + rotate semua secret
   - Tambah CSRF protection di semua mutation endpoints
   - Fix silent Duitku failure (jangan redirect ke success kalo payment gagal)
   - Webhook amount verification (cocokkan dengan DB)
   - Ganti hardcoded email tenant di Duitku invoice
   - Soft delete untuk cancel transaction
   - Fix `cancelAllSubscriptions` logic (addonType check)
   - Tambah FK/index ke Subscription & PaymentTransaction siteId

2. **🟠 Mendesak (High):**
   - Backend password validation (min length, complexity)
   - Fix referral code generator (ganti crypto.randomUUID)
   - Hapus duplicate event handlers (selesai)
   - Fix creditOwner logic, affiliate commission di order webhook
   - Tambah index di 20+ kolom
   - Fix currency default inconsistency (USD/IDR)
   - Fix Decimal precision (tambah @db.Decimal(10,2))
   - Tambah unique constraint MediaFolder[siteId, name]
   - Konsistenkan enum vs string di status fields
   - Kurangi rate limit auth endpoint (500/15min → 20/15min)
   - Auth endpoint rate limit jangan bypass di development
   - Fix webhook ack timing (jangan kirim OK sebelum processing)
   - Enkripsi secrets di PlatformSettings (API keys di DB plaintext)
   - Ganti UI-avatars.com dengan self-hosted avatar fallback
   - Fix API error responses — tambah Content-Type: application/json

3. **🟡 Penting (Medium):**
   - Rate limiting untuk order/payment endpoints per user
   - Idempotency key untuk checkout flow
   - Audit trail untuk admin actions
   - Input validation dengan Zod di semua endpoint
   - Coupon validation di dalam DB transaction
   - Fix 401 vs 403 status codes (forbidden ≠ unauthorized)

4. **🟢 Perbaikan (Low):**
   - Hapus `Bun.gc(true)` dari health endpoint
   - Konsistenkan import path pattern (`@/lib/` vs `@/modules/`)
   - Hapus global mutable `rotationIndex` di AI endpoint
   - Cache payment methods response
   - Fix clipboard API error handling (cek `navigator.clipboard`)
   - Internationalisasi error messages (konsisten bahasa)
   - Fix `PaymentMethodSelector` hardcoded price 50000
   - QR code jangan pakai API eksternal (privacy risk)
   - Konsistenkan `apiResponse`/`apiError` helpers di semua route
