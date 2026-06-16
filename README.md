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

## 🏗️ Arsitektur (Modular Monolith + Event-Driven)

Aplikasi menggunakan **Modular Monolith** dengan **14 modul domain**. Setiap modul memiliki batas logis (logical boundaries) yang ketat. Komunikasi lintas modul dibatasi melalui:

- **Facade Pattern** (`XxxClient`): Kontrak publik setiap modul melalui `index.ts`
- **Event Bus** (Redis pub/sub): Komunikasi async lintas modul tanpa coupling
- **Kepatuhan dependency-cruiser**: Zero violations — semua dependency terverifikasi

### Path Aliases

| Alias | Modul |
|-------|-------|
| `@/modules/auth/*` | Autentikasi, user, affiliate |
| `@/modules/catalog/*` | Produk, katalog, toko |
| `@/modules/domain/*` | Domain kustom, verifikasi DNS |
| `@/modules/financial/*` | Kupon, komisi afiliasi, withdrawal |
| `@/modules/infrastructure/*` | Provisioning, backup, storage |
| `@/modules/media/*` | Media, gallery, portfolio |
| `@/modules/notification/*` | Email, WhatsApp, follow-up |
| `@/modules/order/*` | Pesanan e-commerce, checkout |
| `@/modules/page/*` | Pages, menu, content display, credbuild |
| `@/modules/payment/*` | Transaksi billing, payment gateway |
| `@/modules/post/*` | Blog, taxonomies, testimonial, search |
| `@/modules/shared/*` | Utility, hooks, themes, UI global, event bus |
| `@/modules/site/*` | Site settings, analytics, contact |
| `@/modules/subscription/*` | Plans, subscriptions, platform settings |

---

## 🏗️ Struktur Proyek

```
SitusBisnis-migration/
├── prisma/                 # Database schema (22 model, decoupled)
├── src/
│   ├── app/                # Routes & API (Next.js App Router)
│   │   ├── (site)/         # Tenant-facing: blog, shop, gallery, etc.
│   │   ├── (pages)/        # Marketing: landing, pricing, onboarding
│   │   ├── api/            # RESTful API (73 route, zero direct db access)
│   │   ├── dashboard/      # User dashboard
│   │   └── admin/          # Admin panel
│   │
│   └── modules/            # 14 Modular Monolith domain modules
│       ├── auth/           # Authentication, users, NextAuth
│       ├── catalog/        # Products, shop, catalog
│       ├── domain/         # Custom domain, DNS verification
│       ├── financial/      # Coupons, commissions, withdrawals
│       ├── infrastructure/ # Provisioning, backup, R2 storage
│       ├── media/          # Media library, gallery, portfolio
│       ├── notification/   # Email, WhatsApp, follow-up
│       ├── order/          # E-commerce orders, checkout
│       ├── page/           # Pages, menus, credbuild, content display
│       ├── payment/        # Billing transactions, Duitku
│       ├── post/           # Blog, taxonomies, testimonials, search
│       ├── shared/         # Utilities, hooks, themes, event bus
│       ├── site/           # Site settings, analytics, contact
│       └── subscription/   # Plans, subscriptions, platform settings
├── tests/                  # Unit (Vitest) & E2E (Playwright)
```

### Layered Architecture (Setiap Modul)

```
modules/<domain>/
├── index.ts        # Facade (XxxClient) — public contract
├── controllers/    # Orchestration, delegates to services
├── services/       # Business logic
├── repositories/   # Database access (Prisma)
├── ui/             # React components
└── listeners/      # Event bus handlers
```

---

## ✅ Architecture Compliance

| Check | Status |
|-------|--------|
| **TypeScript** | `tsc --noEmit` — 0 errors |
| **Dependency** | `depcruise` — 0 violations, 490 modules, 1023 dependencies |

---

## 🌐 Multi-Tenant System

Tenant detection via subdomain or custom domain:

```typescript
import { getSiteId, getTenant } from "@/modules/shared/utils/domains/tenant";

const siteId = await getSiteId(); // Guaranteed site isolation
```

---

## 📡 Event-Driven Architecture

Komunikasi async antar modul melalui event bus (Redis pub/sub):

```typescript
// Publish event
await eventBus.publish("billing.payment.completed", payload, "billing");

// Listen event (via listeners/index.ts)
eventBus.subscribe("billing.payment.completed", async (payload) => {
    // Handle payment completion
});
```

---

## 🔧 Development Guidelines

1. **Imports**: Use `@/` aliases only. No relative imports across modules.
2. **Cross-module**: Always use facade (`XxxClient`) or event bus. Never import internal services/repos.
3. **Database**: Only access via repositories layer. Never `db.` in controllers/services/ui.
4. **UI**: Module-specific UI goes in `ui/` folder within the module.
5. **Testing**: Unit tests in `tests/unit/`, E2E in `tests/e2e/`.

---

## 📄 License

Private - © 2026 Crediblemark

## 📚 Dokumentasi

Seluruh dokumentasi teknis ada di folder [docs/](docs/):

### 🏗️ Arsitektur
- [Architecture Overview (EN)](docs/en/ARCHITECTURE.md) | [Tinjauan Arsitektur (ID)](docs/id/ARCHITECTURE.md)
- [Architecture Decision Records (EN)](docs/en/ARCHITECTURE_DECISIONS.md)

### 🚀 Operasional
- [Installation Guide (EN)](docs/en/INSTALLATION.md) | [Panduan Instalasi (ID)](docs/id/INSTALLATION.md)
- [Deployment Guide (EN)](docs/en/DEPLOYMENT.md) | [Panduan Deployment (ID)](docs/id/DEPLOYMENT.md)
- [Dokploy Deployment Guide (EN)](docs/en/dokploy-deployment-guide.md)
- [Operations Runbook (EN)](docs/en/RUNBOOK.md)

### 🔧 Standar
- [Testing Guide (EN)](docs/en/TESTING.md)
- [Contributing (EN)](docs/en/CONTRIBUTING.md)
- [Security Policy (EN)](docs/en/SECURITY.md)
- [Changelog (EN)](docs/en/CHANGELOG.md)

---

_Terakhir Diperbarui: Juni 2026_
