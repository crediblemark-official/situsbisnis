# Rencana Refaktorisasi Rute API ke Modular Monolith

Dokumen ini menjelaskan rencana detail untuk merapikan dan mendesentralisasikan seluruh rute API di bawah `/src/app/api` agar mematuhi batasan arsitektur **Modular Monolith** dengan menggunakan **Layered Architecture** (Facade -> Service -> Repository).

---

## 1. Latar Belakang & Masalah
Saat ini, beberapa rute API di `/src/app/api` masih melakukan kueri langsung ke database menggunakan objek Prisma `db` (misalnya, `db.paymentTransaction.findUnique`, `db.product.findMany`, dll.). Hal ini melanggar prinsip batas logis modul (Logical Boundaries) karena:
1. **Kebocoran Batas Modul (Boundary Leakage)**: Rute API bertindak sebagai lapisan aplikasi luar, namun mengakses tabel database internal modul domain secara langsung tanpa melalui Facade kontrak publik.
2. **Ketergantungan Ketat (Tight Coupling)**: Mengubah skema database di suatu modul akan merusak rute API luar secara langsung tanpa ada lapisan isolasi (Service/Repository).
3. **Duplikasi Logika (Redundancy)**: Logika bisnis seperti perhitungan harga, validasi akses, atau pemanggilan gateway pembayaran Duitku tertulis langsung di handler API Next.js.

---

## 2. Pendekatan Solusi: Layered Architecture
Untuk mematuhinya, rute API harus diubah menjadi **Thin Controller** (hanya menangani request, session, dan respons HTTP) yang memanggil Facade Modul.

Proses refaktorisasi per rute API akan mengikuti bagan berikut:

```
[Request HTTP] -> [src/app/api/.../route.ts (Thin Controller)]
                         |
                         v (Menggunakan Client Facade)
             [src/modules/<domain>/index.ts (Facade Client)]
                         |
                         v
             [src/modules/<domain>/services/*.ts (Bisnis Logik)]
                         |
                         v
             [src/modules/<domain>/repositories/*.ts (Kueri Prisma db)]
```

---

## 3. Rencana Pembersihan Rute API per Domain

### A. Modul Billing (`/src/app/api/billing/*`)
Seluruh rute ini harus didelegasikan ke `BillingClient` di `src/modules/billing`:
* `buy-slot/route.ts`: Pindahkan logika pembuatan transaksi slot, pemanggilan API Duitku, dan pengecekan transaksi pending ke `billing.service.ts` & `billing.repository.ts`.
* `cancel/route.ts`: Pindahkan pembatalan transaksi pending ke service.
* `check-status/route.ts`: Pindahkan pengecekan transaksi pembayaran ke service.
* `checkout/payment/route.ts`: Pindahkan inisialisasi checkout pembayaran ke service.
* `confirm/route.ts`: Pindahkan konfirmasi pembayaran manual ke service.
* `extend-trial/route.ts`: Pindahkan perpanjangan masa uji coba (trial) ke service.
* `payment-methods/route.ts`: Pindahkan pengambilan metode pembayaran platform ke service.
* `upgrade/route.ts`: Pindahkan logika upgrade paket langganan ke service.
* `validate-coupon/route.ts`: Pindahkan validasi kupon diskon ke service.
* `webhook/duitku/route.ts`: Pindahkan logika pemrosesan callback pembayaran Duitku ke service.

### B. Modul Order & Checkout (`/src/app/api/orders/*`)
Seluruh rute ini harus didelegasikan ke `OrderClient` di `src/modules/order`:
* `orders/route.ts`: Logika list order dan pembuatan order baru masuk ke `order.service.ts`.
* `orders/[id]/route.ts`: Logika detail dan update status order.
* `orders/check-status/route.ts`: Pengecekan status pembayaran order.
* `orders/payment/route.ts`: Inisialisasi pembayaran order.
* `orders/payment-methods/route.ts`: Pengambilan metode pembayaran order.
* `orders/webhook/duitku/route.ts`: Pemrosesan callback Duitku khusus transaksi order belanja.

### C. Modul Catalog (`/src/app/api/products/*`)
Seluruh rute ini harus didelegasikan ke `CatalogClient` di `src/modules/catalog`:
* `products/route.ts` & `products/[id]/route.ts`: Logika manajemen produk (tambah, edit, list, hapus) dipindahkan ke `catalog.service.ts` dan `catalog.repository.ts`.

### D. Modul Content (`/src/app/api/{posts,testimonials,pages,portfolios,menus,taxonomies}/*`)
Seluruh rute ini harus didelegasikan ke `ContentClient` di `src/modules/content`:
* Logika manajemen postingan blog, halaman visual builder, menu navigasi, testimonial pelanggan, kategori/tag, dan portofolio dipindahkan ke `content.service.ts` dan `content.repository.ts`.

### E. Modul Tenant / Site (`/src/app/api/user/sites/*`, `/src/app/api/admin/sites/*`)
Seluruh rute ini harus didelegasikan ke `TenantClient` di `src/modules/tenant`:
* Logika verifikasi kepemilikan situs, domain verification, dan statistik situs dipindahkan ke `tenant.service.ts` dan `tenant.repository.ts`.

### F. Modul Auth (`/src/app/api/users/*`, `/src/app/api/profile/*`)
Seluruh rute ini harus didelegasikan ke `AuthClient` di `src/modules/auth`:
* Logika manajemen profil user, registrasi manual, dan hak akses user admin dipindahkan ke `user.service.ts` dan `user.repository.ts` di bawah modul `auth`.

---

## 4. Rencana Verifikasi
Setiap modul yang selesai dimigrasi harus lulus pengujian berikut sebelum di-commit:
1. **Typecheck (`bun run typecheck`)**: Tidak boleh ada error tipe TypeScript.
2. **Linter Arsitektur (`bun run test:architecture`)**: Memastikan tidak ada pelanggaran dependensi lintas modul.
3. **Unit Tests (`bun run test:unit`)**: Memastikan semua pengujian Vitest sukses 100%.
4. **Production Build (`bun run build`)**: Menjamin kompilasi Next.js berjalan tanpa hambatan.
