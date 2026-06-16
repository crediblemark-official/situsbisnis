# Technical Architecture

1001-Web is built with a focus on modularity, security, and high performance.

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack)
- **Visual Builder**: [CredBuild](https://build.crediblemark.com) 
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **Styling**: Vanilla CSS with Tailwind CSS v4 for layouts
- **Auth**: [NextAuth.js](https://next-auth.js.org/)
- **Storage**: Cloudflare R2 (S3-compatible)

---

## Technical Logic

### 1. Hybrid Routing (The Proxy)
1001-Web uses a `proxy.ts` middleware and internal rewrites to handle two distinct types of pages:
- **Standard Pages**: Managed via the Tiptap editor and database fields.
- **Visual Pages**: Managed via the CredBuild `/credbuild` interface.

The system automatically detects the `useBuilder` flag on a page and renders the appropriate UI.

### 2. Data Persistence
The core data model revolves around:
- **`CredBuildPage`**: Stores JSON data for visual builder layouts.
- **`Post` / `Product`**: Standard content models.
- **`SiteSettings`**: Global site configuration (Logo, SEO, etc).

### 3. Environment Adaptability
1001-Web includes logic in `lib/env-manager.ts` and `app/api/install/status` to detect:
- **Filesystem Permissions**: Detects if it can write to `.env`.
- **System Variables**: Detects if configuration is already provided via hosting platform.

---

## Directory Structure
- `/src/app`: Page routing and API endpoints (Next.js App Router).
- `/src/modules`: Logical Boundaries folder containing domain business modules:
  - `auth`: Authentication, account, NextAuth
  - `billing`: SaaS subscriptions, transactions, payment processing
  - `catalog`: Products, coupons, catalog management
  - `content`: Blog posts, tiptap editor, media, testimonials
  - `order`: E-commerce shopping and orders
  - `tenant`: Tenant sites, custom domains
  - `shared`: Shared utilities, UI components, hooks, and core visual builder engine.
- `/prisma`: Decoupled database schema (without physical cross-module relations).
- `/tests`: Unit testing (Vitest) and E2E testing (Playwright).

---

## Layered Architecture
Every module under `/src/modules` (except `shared`) adopts four layers for clear separation of concerns:
1. **Facade Layer (`index.ts`)**: The module's official entry point (e.g., `CatalogClient`). It only invokes `actions.ts`.
2. **Action Layer (`actions.ts`)**: Receives input, handles basic authentication/session contexts, and delegates to *Service*.
3. **Service Layer (`services/*.service.ts`)**: Where all business logic is validated and processed.
4. **Repository Layer (`repositories/*.repository.ts`)**: The only part of the module permitted to invoke the database client (`db`) directly.
