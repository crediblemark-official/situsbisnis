# Technical Architecture

1001-Web is built with a focus on modularity, security, and high performance.

## Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Visual Builder**: [CredBuild](https://build.crediblemark.com) 
- **Database**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **Styling**: Vanilla CSS with Tailwind CSS for layouts
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
- `/app`: Next.js App Router (Routes and APIs).
- `/components`: UI components.
- `/packages/core`: The core CredBuild builder engine.
- `/lib`: Shared utilities (Database, Env management).
- `/prisma`: Schema and migrations.
- `/scripts`: One-off maintenance scripts.
