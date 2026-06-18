# Struktur CRUD di Modular Monolith SitusBisnis

## Prinsip Dasar

Setiap modul memiliki **struktur yang konsisten**, termasuk:

- `crud/`: Direktori konfigurasi CRUD untuk model dalam modul tersebut
  - `crud-handler.ts`: Implementasi penuh handler CRUD (GET, POST, PUT, PATCH, DELETE, GET_DETAIL)
  - `{resource}.ts`: Konfigurasi definisi resource (field, validasi, relasi)
- `services/`: Bisnis logic layer
- `repositories/`: Data access layer
- `ui/`: Domain-specific components
- `public-actions.ts`: Jembatan Server Actions untuk UI

## Perubahan Arsitektur

**`modules/crud/` (centralized engine) telah dihapus.** Setiap modul kini memiliki `crud-handler.ts` sendiri
untuk menghilangkan ketergantungan ke engine terpusat. Cache invalidation listener dipindah ke
`catalog/crud/listener.ts` dan di-import oleh `instrumentation.ts`.

---

## Daftar Modul dengan CRUD

### 1. Modul `catalog`

- **Direktori CRUD**: `src/modules/catalog/crud/`
- **File**:
  - `crud-handler.ts`: Implementasi handler CRUD
  - `product.ts`: Konfigurasi CRUD untuk `Product`
  - `index.ts`: Ekspor semua konfigurasi CRUD dari modul
  - `listener.ts`: Cache invalidation listener (didaftarkan via instrumentation.ts)
- **Fungsi**: `productApi.GET`, `productApi.POST`, `productApi.PUT`, `productApi.PATCH`, `productApi.DELETE`, `productApi.GET_DETAIL`

### 2. Modul `media`

- **Direktori CRUD**: `src/modules/media/crud/`
- **File**:
  - `crud-handler.ts`: Implementasi handler CRUD
  - `gallery.ts`: Konfigurasi CRUD untuk `GalleryItem`
  - `portfolio.ts`: Konfigurasi CRUD untuk `PortfolioItem`
  - `index.ts`: Ekspor semua konfigurasi CRUD dari modul
- **Fungsi**: `galleryApi.*`, `portfolioApi.*`

### 3. Modul `post`

- **Direktori CRUD**: `src/modules/post/crud/`
- **File**:
  - `crud-handler.ts`: Implementasi handler CRUD
  - `post.ts`: Konfigurasi CRUD untuk `Post`
  - `testimonial.ts`: Konfigurasi CRUD untuk `Testimonial`
  - `taxonomy.ts`: Konfigurasi CRUD untuk `Taxonomy`
  - `index.ts`: Ekspor semua konfigurasi CRUD dari modul
- **Fungsi**: `postApi.*`, `testimonialApi.*`, `taxonomyApi.*`

---

## Endpoint HTTP (Jembatan Next.js)

- **Direktori**: `src/app/endpoints/`
- **File**:
  - `routes.ts`: Daftar semua endpoint dan routing terpusat (75+ route entries)
  - `[...route]/route.ts`: Catch-all handler yang memanggil `resolveEndpoint` dari `routes.ts`

Endpoints ini **hanya sebagai jembatan** antara Next.js HTTP runtime dan module bisnis di `src/modules/`.

---

## Alur Request Endpoint

1. Request masuk ke `src/app/endpoints/[...route]/route.ts`
2. `route.ts` memanggil `resolveEndpoint` dari `routes.ts`
3. `resolveEndpoint` mencari endpoint yang sesuai di daftar `endpoints`
4. Handler endpoint memanggil logic dari modul bisnis (contoh: `productApi.GET`)
5. Response dikembalikan ke klien

---

## Catatan

- Modul dengan logika kompleks (auth, payment, order, subscription, site, dll) tidak menggunakan CRUD handler
  melainkan `controllers/` → `services/` → `repositories/` untuk fleksibilitas lebih.
- Resource files meng-import `crud-handler` secara lokal (`./crud-handler`), bukan dari shared path.
