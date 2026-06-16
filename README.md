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

## 🏗️ Architecture & Standards

### Path Aliases

We use `@/*` aliases for all internal imports to maintain a clean and flat codebase.

- `@/lib/*`: Core logic, services, and settings.
- `@/components/*`: Reusable UI and dashboard components.
- `@/hooks/*`: Custom React hooks.

### Magic Edit Mode

Every public page can be edited by simply appending `/edit` to the URL. This is handled by a custom `proxy.ts` layer that rewrites requests to the `app/credbuild/` engine.

### Premium Matrix UI

The dashboard follows a **High-Density UI** standard:

- **Ergonomics**: 5px border radius (rounded-md) and 10px padding (p-2.5) for all interactive elements.
- **Visuals**: Neutral-dark aesthetics with Lucide icons for quick scanning.
- **Safety**: Destructive actions are always gated by a high-fidelity `ConfirmationModal`.

---

## 🏗️ Project Structure

```
1001_WEB/
├── app/                    # Next.js App Router
│   ├── (site)/            # Public site pages (blogs, shop, etc)
│   ├── dashboard/         # Premium Admin dashboard
│   ├── api/              # RESTful CRUD API
│   └── credbuild/        # Visual editor engine
├── components/
│   ├── ui/              # Reusable "Premium Matrix" components
│   ├── dashboard/       # Specialized dashboard blocks
│   └── credbuild/       # Visual builder blocks
├── lib/                  # Services, Settings, and API Context
├── themes/              # Global theme layouts (default, luxury)
└── tests/               # Vitest unit & integration tests
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

---

## 📚 Related Documentation

- [API Migration Plan](./api-migration-plan.md) - RESTful migration status
- [Code Analysis](./bug2.md) - Full codebase review
- [Architecture](./bug3.md) - Senior architect review
- [A+ Action Items](./bug4.md) - Quality improvements
- [API Analysis](./bug5.md) - API routes audit

---

_Last Updated: May 2026_

---

_Last Updated: May 2026_
