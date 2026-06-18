# Arsitektur Teknis

SitusBisnis sedang dalam migrasi menuju arsitektur **Modular Monolith** dan **Event-Driven Architecture**. Fondasi modular dan layered sudah tersedia, sedangkan event-driven masih pada tahap implementasi awal. Komunikasi lintas modul dikontrol secara ketat melalui facade dan event bus.

---

## Stack Teknologi

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router dengan Turbopack)
- **Visual Builder**: [CredBuild](https://build.crediblemark.com)
- **Database**: [Prisma ORM](https://www.prisma.io/) dengan PostgreSQL (22 model, decoupled)
- **Styling**: Vanilla CSS dengan Tailwind CSS v4
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Penyimpanan**: Cloudflare R2 (S3-compatible)
- **Event Bus**: Redis pub/sub (opsional, dengan outbox fallback)

---

## Ikhtisar Arsitektur

### Modular Monolith

Aplikasi diorganisir ke dalam **14 modul domain** di bawah `src/modules/`. Setiap modul adalah unit mandiri dengan:

- **Logika bisnis** (services)
- **Akses data** (repositories)
- **Komponen UI** (ui/)
- **Penangan event** (listeners/)

Komunikasi lintas modul dikontrol secara ketat:

1. **Facade Pattern**: Setiap modul mengekspos `XxxClient` melalui `index.ts`
2. **Event Bus**: Komunikasi async via Redis pub/sub + outbox pattern
3. **Dependency Cruiser**: Semua dependensi modul diverifikasi di CI

---

## Struktur Direktori

```
src/
├── app/                    # Next.js App Router
│   ├── (site)/             # Rute tenant (blog, shop, gallery, dll)
│   ├── (pages)/            # Halaman marketing (landing, pricing, dll)
│   ├── endpoints/          # RESTful API terpusat via catch-all route (endpoints/[...route]/route.ts)
│   ├── dashboard/          # Dashboard pengguna
│   └── admin/              # Panel admin platform
│
└── modules/                # 14 modul domain
    ├── auth/               # Autentikasi, user, NextAuth, tim
    ├── catalog/            # Produk, toko, manajemen katalog
    ├── domain/             # Domain kustom, verifikasi DNS
    ├── financial/          # Kupon, komisi afiliasi, withdrawal
    ├── infrastructure/     # Provisioning situs, backup database, penyimpanan R2
    ├── media/              # Perpustakaan media, galeri, portofolio
    ├── notification/       # Email (Resend/StarSender), WhatsApp, follow-up
    ├── order/              # Pesanan e-commerce, checkout pelanggan
    ├── page/               # Halaman (CredBuild), menu, tampilan konten
    ├── payment/            # Tagihan langganan, gateway Duitku
    ├── post/               # Blog, taksonomi, testimonial, pencarian
    ├── shared/             # Utilitas, hooks, tema, event bus, UI dasar
    ├── site/               # Pengaturan situs, analytics, kontak masuk
    └── subscription/       # Paket, langganan, pengaturan platform
```

---

## Arsitektur Berlapis

Setiap modul mengikuti struktur folder **100% konsisten**:

```
modules/<domain>/
├── index.ts                # 🔑 Facade (XxxClient) — API publik untuk modul lain
├── public-actions.ts       # 🎯 Wrapper Server Actions untuk UI/shared
├── actions/                # 🔧 Internal Server Actions
├── controllers/            # 🔌 HTTP Controllers / Adapters
├── crud/                   # ⚙️ Konfigurasi CRUD untuk model domain
├── services/               # 🧠 Logika bisnis — semua aturan domain di sini
├── repositories/           # 💾 Akses data — SATU-SATUNYA lapisan yang menyentuh Prisma/db
├── ui/                     # 🎨 Komponen React spesifik domain ini
└── listeners/              # 👂 Penangan event bus (langganan pub/sub)
```

Modul yang memiliki direktori `crud/`:

- `catalog/crud/`: CRUD untuk `Product`
- `media/crud/`: CRUD untuk `GalleryItem` dan `PortfolioItem`
- `post/crud/`: CRUD untuk `Post`, `Testimonial`, dan `Taxonomy`

### Aturan Antar Lapisan

| Lapisan             | Bisa import             | Tidak bisa import               |
| ------------------- | ----------------------- | ------------------------------- |
| `index.ts` (Facade) | controllers             | repositories, services langsung |
| `controllers/`      | services                | repositories, db                |
| `services/`         | repositories, event bus | db, internal modul lain         |
| `repositories/`     | `db` dari shared        | modul lain                      |
| `ui/`               | index.ts (facade)       | services, repositories langsung |
| `listeners/`        | services, event bus     | controllers langsung            |

### Komunikasi Lintas Modul

```typescript
// ✅ BENAR: Via facade
import { SubscriptionClient } from "@/modules/subscription";
const plan = await SubscriptionClient.findPlanById(planId);

// ✅ BENAR: Via event bus
await eventBus.publish("billing.payment.completed", payload, "billing");

// ❌ SALAH: Import repo langsung (diblokir dependency-cruiser)
import * as planRepo from "@/modules/subscription/repositories/plan.repository";
```

---

## Arsitektur Event-Driven

### Alur Event

1. **Publisher** memanggil `eventBus.publish(eventName, payload, sourceModule)`
2. **Outbox** menulis ke tabel `eventOutbox` (jaminan pengiriman)
3. **Redis pub/sub** menyiarkan ke semua listener
4. **Listeners** di setiap modul memproses event

### Event Utama

| Event                          | Publisher      | Konsumen                                                                |
| ------------------------------ | -------------- | ----------------------------------------------------------------------- |
| `billing.payment.completed`    | payment        | subscription (aktivasi paket), financial (komisi), notification (email) |
| `affiliate.commission.awarded` | payment        | notification (email)                                                    |
| `tenant.site.created`          | infrastructure | auth (tautkan user), notification (email sambutan)                      |

---

## Kepatuhan

| Alat                            | Hasil                                     |
| ------------------------------- | ----------------------------------------- |
| **TypeScript** (`tsc --noEmit`) | 0 error                                   |
| **Dependency Cruiser**          | 0 pelanggaran (360 modul, 919 dependensi) |
| **Prisma**                      | 22 model, tanpa `@relation` lintas model  |

---

## Endpoint HTTP Terpusat

Semua endpoint HTTP diatur di `src/app/endpoints/`:

- `routes.ts`: Routing table terpusat
- `[...route]/route.ts`: Catch-all handler yang menjadi jembatan antara Next.js dan module bisnis

**Alur Request:**

```
Next.js route handler
  ↓
resolveEndpoint() dari routing table
  ↓
Controller / CRUD handler dari module bisnis
  ↓
Services / Repositories
  ↓
Response ke klien
```
