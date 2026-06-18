# Technical Architecture

SitusBisnis is built with a **Modular Monolith** architecture — 14 domain modules with strict logical boundaries, communicating through facades and an event bus.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **Visual Builder**: [CredBuild](https://build.crediblemark.com)
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL (22 models, decoupled)
- **Styling**: Vanilla CSS with Tailwind CSS v4
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Event Bus**: Redis pub/sub (optional, with outbox fallback)

---

## Architecture Overview

### Modular Monolith

The application is organized into **14 domain modules** under `src/modules/`. Each module is a self-contained unit with its own:

- **Business logic** (services)
- **Data access** (repositories)
- **UI components** (ui/)
- **Event handlers** (listeners/)

Cross-module communication is strictly controlled:

1. **Facade Pattern**: Each module exposes a `XxxClient` via `index.ts`
2. **Event Bus**: Async communication via Redis pub/sub + outbox pattern
3. **Dependency Cruiser**: All module dependencies are verified at CI

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (site)/             # Tenant-facing routes
│   ├── (pages)/            # Marketing pages (landing, pricing, etc.)
│   ├── endpoints/          # ✅ HTTP BRIDGE:
│   │   ├── routes.ts       # Centralized routing table
│   │   └── [...route]/route.ts # Catch-all handler
│   ├── dashboard/          # User dashboard
│   └── admin/              # Admin platform panel
│
└── modules/                # 14 domain modules
    ├── auth/               # Authentication, users, NextAuth, teams
    ├── catalog/            # Products, shop, catalog management
    ├── domain/             # Custom domain, DNS verification
    ├── financial/          # Coupons, affiliate commissions, withdrawals
    ├── infrastructure/     # Site provisioning, database backup, R2 storage
    ├── media/              # Media library, gallery, portfolio
    ├── notification/       # Email (Resend/StarSender), WhatsApp, follow-up
    ├── order/              # E-commerce orders, customer checkout
    ├── page/               # Pages (CredBuild), menus, content display
    ├── payment/            # Subscription billing, Duitku gateway
    ├── post/               # Blog, taxonomies, testimonials, search
    ├── shared/             # Utilities, hooks, themes, event bus, UI primitives
    ├── site/               # Site settings, analytics, contact submissions
    └── subscription/       # Plans, subscriptions, platform settings
```

---

## Layered Architecture

Every module follows **100% consistent folder structure**:

```
modules/<domain>/
├── index.ts                # 🔑 Facade (XxxClient) — public API for other modules
├── public-actions.ts       # 🎯 Wrapped Server Actions for UI/shared
├── actions/                # 🔧 Internal Server Actions
├── controllers/            # 🔌 HTTP Controllers / Adapters
├── crud/                   # ⚙️ CRUD configs for domain models
├── services/               # 🧠 Business logic — all domain rules live here
├── repositories/           # 💾 Data access — ONLY layer that touches Prisma/db
├── ui/                     # 🎨 React components specific to this domain
└── listeners/              # 👂 Event bus handlers (pub/sub subscriptions)
```

Modules with `crud/` directory:

- `catalog/crud/`: CRUD for `Product`
- `media/crud/`: CRUD for `GalleryItem` and `PortfolioItem`
- `post/crud/`: CRUD for `Post`, `Testimonial`, and `Taxonomy`

### Layer Rules

| Layer               | Can import              | Cannot import                   |
| ------------------- | ----------------------- | ------------------------------- |
| `index.ts` (Facade) | controllers             | repositories, services directly |
| `controllers/`      | services                | repositories, db                |
| `services/`         | repositories, event bus | db, other modules' internals    |
| `repositories/`     | `db` from shared        | other modules                   |
| `ui/`               | index.ts (facade)       | services, repositories directly |
| `listeners/`        | services, event bus     | controllers directly            |

### Cross-Module Communication

```typescript
// ✅ CORRECT: Via facade
import { SubscriptionClient } from "@/modules/subscription";
const plan = await SubscriptionClient.findPlanById(planId);

// ✅ CORRECT: Via event bus
await eventBus.publish("billing.payment.completed", payload, "billing");

// ❌ WRONG: Direct repo import (blocked by dependency-cruiser)
import * as planRepo from "@/modules/subscription/repositories/plan.repository";
```

---

## Event-Driven Architecture

### Event Flow

1. **Publisher** calls `eventBus.publish(eventName, payload, sourceModule)`
2. **Outbox** writes to `eventOutbox` table (guaranteed delivery)
3. **Redis pub/sub** broadcasts to all listeners
4. **Listeners** in each module process the event

### Key Events

| Event                          | Publisher      | Consumers                                                                  |
| ------------------------------ | -------------- | -------------------------------------------------------------------------- |
| `billing.payment.completed`    | payment        | subscription (activate plan), financial (commission), notification (email) |
| `affiliate.commission.awarded` | payment        | notification (email)                                                       |
| `tenant.site.created`          | infrastructure | auth (link user), notification (welcome email)                             |

---

## Compliance

| Tool                            | Result                                       |
| ------------------------------- | -------------------------------------------- |
| **TypeScript** (`tsc --noEmit`) | 0 errors                                     |
| **Dependency Cruiser**          | 0 violations (360 modules, 919 dependencies) |
| **Prisma**                      | 22 models, no cross-model `@relation`        |

---

## Centralized HTTP Endpoints

All HTTP endpoints are organized in `src/app/endpoints/`:

- `routes.ts`: Centralized routing table
- `[...route]/route.ts`: Catch-all handler that acts as a bridge between Next.js and business modules

**Request Flow:**

```
Next.js route handler
  ↓
resolveEndpoint() from routing table
  ↓
Controller / CRUD handler from business module
  ↓
Services / Repositories
  ↓
Response to client
```
