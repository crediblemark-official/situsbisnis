# Rencana Optimasi SitusBisnis-migration

> Berdasarkan analisis performa real dari `npm run dev` dan source code.
> Tanggal: 19 Juni 2026

---

## Critical: Midtrans Payment Error

**Error di log:**

```
Midtrans API is returning API error. HTTP status code: 402
status_message: "Payment channel is not activated."
```

**Penyebab:** Payment channel (BCA VA, QRIS, dll) belum diaktifkan di dashboard Midtrans.

**Solusi:**

1. Login ke https://dashboard.sandbox.midtrans.com (sandbox) atau https://dashboard.midtrans.com (production)
2. Masuk ke menu **Settings > Payment Channels**
3. Aktifkan channel yang ingin digunakan: BCA VA, QRIS, GoPay, dll
4. Untuk sandbox, beberapa channel aktif otomatis, pastikan tidak disabled
5. Simpan dan tunggu 5-10 menit

**Cek konfigurasi di kode:**

- `src/modules/payment/services/checkout.service.ts` — `FORCE_SNAP_MODE = true` hardcoded
- Pastikan `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` di `.env` benar
- Snap API digunakan (bukan Core API), pastikan Snap diaktifkan di dashboard

---

## Prioritas 1: Cold Start & Compile Time

**Masalah dari log:**

```
GET / 200 in 10.9s (next.js: 10.2s)
GET /dashboard 200 in 9.0s (next.js: 8.2s)
GET /dashboard/checkout/xxx 200 in 4.2s (next.js: 4.0s)
```

**Penyebab:** Turbopack mengkompilasi ulang dari awal setiap kali ada page baru yang diakses.

**Solusi:**

### 1.1 Persistent Caching Turbopack

```bash
# Di package.json, tambahkan flag
"dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev --turbo --experimental-optimize"
```

### 1.2 Pre-compile Pages Saat Startup

Buat file `src/preload.ts` yang import semua route utama saat startup:

```typescript
// Instrumentasi atau di root layout
// Import semua route utama agar dikompilasi sekali
import "@/app/(site)/page";
import "@/app/dashboard/page";
import "@/app/dashboard/sites/page";
import "@/app/dashboard/billing/page";
```

### 1.3 Lazy Load Heavy Modules

Beberapa module berat yang lambat dikompilasi:

- `@tiptap/*` (rich text editor)
- `@crediblemark/build-ui` (visual builder)
- `lucide-react` (icons)

Pastikan hanya di-import di halaman yang membutuhkan, bukan di root layout.

---

## Prioritas 2: Duplicate API Calls

**Masalah dari log:**

```
GET /api/settings 200 in 1806ms  (halaman utama)
GET /api/settings 200 in 109ms   (dashboard)
GET /api/settings 200 in 25ms    (dashboard)
GET /api/settings 200 in 218ms   (billing)
GET /api/settings 200 in 307ms   (checkout)
-> Total 5 kali dipanggil dalam 1 sesi
```

```
GET /api/auth/session 200 in 1327ms (halaman utama)
GET /api/auth/session 200 in 169ms  (dashboard)
GET /api/auth/session 200 in 162ms  (billing)
GET /api/auth/session 200 in 309ms  (checkout)
-> Total 4 kali dipanggil
```

**Penyebab:** Setiap page/layout memanggil `getSettings()` dan `getSession()` secara independen, tidak ada cache sharing antar request.

**Solusi:**

### 2.1 React Cache untuk Settings

```typescript
// src/modules/shared/core/settings.ts
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getCachedSettings = cache(async () => {
  return prisma.platformSettings.findFirst();
});
```

### 2.2 Request Deduplication untuk Session

```typescript
// Di middleware atau root layout, simpan session di request header
// sehingga komponen turunan bisa membaca tanpa panggil ulang
```

### 2.3 Route Group Cache

Grupkan halaman yang butuh data sama dalam route group yang sama agar layout bisa cache lebih agresif.

---

## Prioritas 3: Polling Berlebihan

**Masalah dari log:**

```
POST checkTransactionStatusAction -> 16-22ms (diulang 6 kali dalam ~1 menit)
```

**Penyebab:** `CheckoutClient.tsx` polling setiap 7 detik tanpa batas maksimal.

**Solusi:**

### 3.1 Batasi Maksimal Polling

```typescript
// src/modules/order/ui/dashboard/checkout/CheckoutClient.tsx
const MAX_POLLING_ATTEMPTS = 20; // 7 detik x 20 = 140 detik (~2 menit)
const pollingAttempts = useRef(0);

useEffect(() => {
  if (status === "paid" || status === "cancelled" || expired) return;

  pollingRef.current = setInterval(() => {
    pollingAttempts.current += 1;
    if (pollingAttempts.current > MAX_POLLING_ATTEMPTS) {
      clearInterval(pollingRef.current);
      setShowTimeoutWarning(true);
      return;
    }
    checkStatus();
  }, 7000);

  return () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  };
}, [checkStatus, status, expired]);
```

### 3.2 Exponential Backoff

```typescript
// Ganti interval tetap dengan backoff
const getPollingInterval = (attempt: number) => {
  if (attempt < 5) return 5000; // 5 detik untuk 5 percobaan pertama
  if (attempt < 10) return 10000; // 10 detik untuk 5 percobaan berikutnya
  return 30000; // 30 detik setelahnya
};
```

### 3.3 Gunakan WebSocket (Ideal)

```typescript
// Alternatif: polling -> WebSocket
// Saat pembayaran sukses, webhook Midtrans trigger event Redis pub/sub
// Push notification ke client via WebSocket
```

---

## Prioritas 4: Server Actions Lambat

**Masalah dari log:**

```
upgradePlanAction -> 714ms
initializeCheckoutPaymentAction (BCA VA) -> 743ms
initializeCheckoutPaymentAction (QRIS) -> 612ms
```

**Penyebab:** Midtrans API response time lambat dari sisi sandbox.

**Solusi:**

### 4.1 Timeout Configuration

```typescript
// src/modules/payment/providers/midtrans.ts
// Tambahkan timeout pada HTTP client
const apiClient = new MidtransClient.Snap({
  isProduction: process.env.NODE_ENV === "production",
  serverKey: config.serverKey,
  clientKey: config.clientKey,
});

// Wrapper dengan timeout
async function snapCreateTransaction(params: any, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await apiClient.createTransaction(params);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
```

### 4.2 Optimasi Query UpgradePlan

`upgradePlanAction` (714ms) kemungkinan besar karena multiple DB queries dalam satu transaksi:

- Cek user session
- Cek site ownership
- Cek plan availability
- Create transaction record
- Hitung harga + diskon

Optimasi: **Batch queries** atau **reduce round trips**.

---

## Prioritas 5: proxy.ts Overhead

**Masalah dari log:** Setiap request melalui `proxy.ts` memakan 3-20ms.

Ini wajar untuk middleware, tapi bisa dioptimasi:

### 5.1 Skip proxy untuk Static Assets

```typescript
// src/proxy.ts (middleware)
export const config = {
  matcher: [
    // Skip static files
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
```

### 5.2 Cache Tenant Resolution

```typescript
// Cache hasil resolve tenant di Map
const tenantCache = new Map<string, TenantInfo>();
const CACHE_TTL = 60000; // 1 menit

function getCachedTenant(hostname: string) {
  const cached = tenantCache.get(hostname);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

---

## Ringkasan Prioritas

| Prioritas    | Item                              | Impact                     | Effort  | Status |
| ------------ | --------------------------------- | -------------------------- | ------- | ------ |
| **CRITICAL** | Aktifkan Midtrans payment channel | Error 402 hilang           | 5 menit | ⏳     |
| **P1**       | Batasi polling checkout           | Beban server turun drastis | Rendah  | ❌     |
| **P1**       | Cache duplicate API calls         | Response time turun 50%    | Rendah  | ❌     |
| **P2**       | Cold start / compile time         | Dev experience             | Sedang  | ❌     |
| **P2**       | Exponential backoff polling       | Beban server turun         | Rendah  | ❌     |
| **P3**       | proxy.ts optimasi                 | Overhead turun             | Rendah  | ❌     |
| **P3**       | Server Actions timeout            | Graceful error handling    | Rendah  | ❌     |
