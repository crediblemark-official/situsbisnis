# SitusBisnis - Multi-Tenant Website Builder

A modern, high-performance multi-tenant CMS built with Next.js, Prisma, and PostgreSQL. Designed for speed, flexibility, and a premium editorial experience.

---

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Generate Prisma client & sync DB
bun run prisma:generate
bun run prisma:db-push

# Run development with Turbopack
bun dev
```

---

## 📦 Tech Stack

| Layer             | Technology                          |
| ----------------- | ----------------------------------- |
| **Framework**     | Next.js 16 (App Router + Turbopack) |
| **Runtime**       | Bun                                 |
| **Database**      | PostgreSQL + Prisma ORM             |
| **Visual Editor** | @crediblemark/build (CredBuild)     |
| **Testing**       | Vitest                              |
| **Styling**       | Tailwind CSS v4 + Vanilla CSS       |
| **Icons**         | Lucide React                        |

---

## 🏗️ Arsitektur & Standar (Modular Monolith)

Aplikasi ini menggunakan pendekatan arsitektur **Modular Monolith** dengan batas logis (logical boundaries) yang ketat antar domain bisnis. Komunikasi lintas modul dibatasi dan hanya diperbolehkan melalui kontrak publik (`index.ts`) dari masing-masing modul. Keterikatan fisik database (foreign keys & join lintas modul) telah dihilangkan demi fleksibilitas pemeliharaan dan skalabilitas.

### Path Aliases

Kami menggunakan alias `@/*` di `tsconfig.json` untuk impor modular dan kode bersama (shared):

- `@/modules/auth/*`: Modul autentikasi, akun, NextAuth
- `@/modules/billing/*`: Modul langganan SaaS, transaksi, pembayaran
- `@/modules/catalog/*`: Modul produk, kupon, manajemen katalog
- `@/modules/content/*`: Modul halaman tiptap, postingan blog, testimonial, media
- `@/modules/order/*`: Modul pesanan e-commerce
- `@/modules/tenant/*`: Modul situs tenant, domain kustom
- `@/shared/*`: Kode bersama global (ui, utils, hooks, themes, types, core)

---

## 🏗️ Struktur Proyek

```
SitusBisnis-migration/
├── prisma/                 # Skema database ter-decouple (tanpa relasi fisik lintas modul)
├── src/
│   ├── app/                # Rute halaman dan API endpoints (Next.js App Router)
│   │   ├── (site)/         # Rute publik (blog, checkout, success, dll.)
│   │   ├── api/            # RESTful API endpoints
│   │   └── dashboard/      # Premium Admin dashboard
│   │
│   └── modules/            # Batas Logis (Logical Boundaries) Modular Monolith
│       ├── auth/           # Fitur login, akun, NextAuth
│       │   ├── actions.ts  # Logika internal (Server Actions / Backend)
│       │   └── index.ts    # Gerbang Kontrak Publik (Facade / Public API)
│       │
│       ├── billing/        # Fitur langganan SaaS dan pembayaran
│       ├── catalog/        # Fitur produk dan kupon
│       ├── content/        # Fitur blog post, tiptap, media
│       ├── order/          # Fitur pesanan e-commerce
│       ├── tenant/         # Fitur subdomain & domain kustom
│       └── shared/         # Infrastruktur dan utilitas bersama (global)
│           ├── core/       # Engine builder utama CredBuild
│           ├── ui/         # Komponen UI global (Premium Matrix)
│           ├── utils/      # Utilitas/helpers pembantu global
│           ├── hooks/      # Custom React hooks global
│           └── themes/     # Tata letak tema global (default, luxury)
```

---

## 🌐 Multi-Tenant System

### Tenant Resolution

The system automatically detects the tenant based on the subdomain or custom domain via `lib/tenant.ts`.

```typescript
import { getSiteId, getTenant } from "@/lib/domains/tenant";

const siteId = await getSiteId(); // Guaranteed site isolation
```

---

## 📡 API Architecture

We use a standardized `createCrudHandler` for 90% of our API routes, ensuring consistent error handling and limit gating.

```typescript
// Example: app/api/products/route.ts
export const { collection, detail } = createCrudHandler({
  model: "product",
  schema: productSchema,
  limitCheckType: "maxProducts",
});
```

---

## 🔧 Development Guidelines

1. **Imports**: Never use `../../`. Always use `@/`.
2. **Components**: Use `ConfirmationModal` for any delete actions.
3. **Themes**: Respect the `--cb-` CSS variables when building builder blocks.
4. **Performance**: Use `next dev --turbo` and limit RAM usage as per the optimization checklist.

---

## 💳 Payment Gateway (Duitku Webhooks)

SitusBisnis integrates with **Duitku** to handle payments. The application distinguishes between SaaS platform subscriptions and tenant/subsite product checkouts by using separate webhook routes:

### 1. SaaS Subscriptions Webhook (Platform Level)

- **Webhook URL**: `https://<your-domain>/api/billing/webhook/duitku`
- **Local Development Callback URL**: `https://slimy-pans-roll.loca.lt/api/billing/webhook/duitku`
- **File Location**: [app/api/billing/webhook/duitku/route.ts](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis/app/api/billing/webhook/duitku/route.ts)
- **Functionality**: Processes SaaS plan upgrades and extra site slot purchases. Credentials (API Key & Merchant Code) are loaded dynamically from global `PlatformSettings` configured via the Admin Panel (no hardcoding in `.env`).

### 2. E-commerce Checkouts Webhook (Tenant/Subsite Level)

- **Webhook URL**: `https://<your-domain>/api/orders/webhook/duitku`
- **Local Development Callback URL**: `https://slimy-pans-roll.loca.lt/api/orders/webhook/duitku`
- **File Location**: [app/api/orders/webhook/duitku/route.ts](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis/app/api/orders/webhook/duitku/route.ts)
- **Functionality**: Processes customer checkout payments for subsite e-commerce products. Credentials are dynamically resolved based on the specific tenant's `PaymentSettings` in the database.

---

## 🔍 Testing

The project uses **Vitest** for fast unit testing.

```bash
# Run all tests
bun test

# Run specific test
bun vitest tests/unit/currency.test.ts
```

---

## 📄 License

Private - © 2026 Crediblemark

## 📚 Dokumentasi Proyek

Seluruh dokumentasi teknis dan panduan operasional proyek telah dikelompokkan ke dalam folder [docs/](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/):

### 🏗️ Arsitektur & Keputusan
- [Tinjauan Arsitektur (Bahasa Indonesia)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/ARCHITECTURE.id.md) | [Architecture Overview (English)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/ARCHITECTURE.md)
- [Panduan Arsitektur Modular Monolith (Bahasa Indonesia)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/MODULAR_MONOLITH.id.md)
- [Architecture Decision Records (ADR)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/ARCHITECTURE_DECISIONS.md)

### 🚀 Instalasi & Deployment
- [Panduan Instalasi (Bahasa Indonesia)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/INSTALLATION.id.md) | [Installation Guide (English)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/INSTALLATION.md)
- [Panduan Deployment (Bahasa Indonesia)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/DEPLOYMENT.id.md) | [Deployment Guide (English)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/DEPLOYMENT.md)
- [Dokploy Deployment Guide (Bahasa Indonesia)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/dokploy-deployment-guide.md)
- [Operations Runbook (English)](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/RUNBOOK.md)

### 🔧 Standar & Prosedur
- [Panduan Pengujian / Testing](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/TESTING.md)
- [Panduan Berkontribusi / Contributing](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/CONTRIBUTING.md)
- [Kebijakan Keamanan / Security](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/SECURITY.md)
- [Changelog Proyek](file:///media/rasyiqi/PROJECT/credibuild-project/SitusBisnis-migration/docs/CHANGELOG.md)

---

_Terakhir Diperbarui: Juni 2026_
