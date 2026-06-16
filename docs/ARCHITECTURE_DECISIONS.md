# Architecture Decision Records (ADR)

## ADR-001: Multi-Tenant Architecture via Subdomain Resolution

**Status:** Accepted  
**Date:** 2024-01-15

### Context
The platform needs to support multiple tenants (sites) with isolated data, custom domains, and subdomain-based routing.

### Decision
- Use subdomain-based tenant resolution (`tenant.example.com`)
- Store tenant data in shared PostgreSQL database with `siteId` isolation
- Use Next.js middleware (`proxy.ts`) to detect and route tenants
- Support custom domains with DNS verification

### Consequences
- **Positive:** Single deployment, shared infrastructure, cost-effective
- **Negative:** Requires careful query scoping to prevent data leaks
- **Risk:** Tenant data isolation depends on correct `siteId` usage in all queries

---

## ADR-002: Prisma ORM for Database Layer

**Status:** Accepted  
**Date:** 2024-01-15

### Context
Need a type-safe, maintainable database layer with migrations and seeding.

### Decision
- Use Prisma ORM with PostgreSQL
- Singleton pattern for Prisma client (prevent HMR connection proliferation)
- Compound unique indexes for efficient lookups (`siteId_slug`)
- Cascade deletes on site relationships

### Consequences
- **Positive:** Type safety, auto-generated types, easy migrations
- **Negative:** Prisma can be slower than raw SQL for complex queries
- **Risk:** Connection limits on serverless deployments

---

## ADR-003: NextAuth.js for Authentication

**Status:** Accepted  
**Date:** 2024-01-15

### Context
Need secure authentication with role-based access control.

### Decision
- NextAuth.js v4 with Credentials provider
- JWT session strategy with custom token callbacks
- Role-based access: `admin`, `owner`, `editor`, `user`
- `__Secure-` cookie prefix in production

### Consequences
- **Positive:** Well-tested, supports multiple providers, secure defaults
- **Negative:** v4 is older, v5 has breaking changes
- **Risk:** JWT tokens can grow large if too much data is stored

---

## ADR-004: Generic CRUD Handler Pattern

**Status:** Accepted  
**Date:** 2024-02-01

### Context
23 API endpoint groups with similar CRUD operations lead to code duplication.

### Decision
- Create `createCrudHandler()` factory function
- Built-in: RBAC, Zod validation, subscription limits, pagination
- Each endpoint configures: model, schema, roles, limit type

### Consequences
- **Positive:** DRY, consistent behavior, easy to add new endpoints
- **Negative:** Less flexibility for custom endpoint logic
- **Risk:** Over-abstraction can make debugging harder

---

## ADR-005: Structured Logging with Pino

**Status:** Accepted  
**Date:** 2026-05-16

### Context
`console.log/error` is insufficient for production debugging and monitoring.

### Decision
- Use Pino for structured JSON logging
- Development: pretty-print with colors
- Production: JSON format for log aggregators
- Module-specific child loggers via `createLogger(moduleName)`

### Consequences
- **Positive:** Searchable logs, correlation IDs, integration with Datadog/ELK
- **Negative:** Slight overhead vs console
- **Risk:** None - standard enterprise pattern

---

## ADR-006: In-Memory Rate Limiting

**Status:** Accepted  
**Date:** 2026-05-16

### Context
API endpoints need protection against abuse and DDoS.

### Decision
- In-memory rate limiter via Next.js middleware
- Configurable limits per endpoint type (auth: 20/15min, default: 100/15min)
- `X-RateLimit-*` response headers
- 429 response with `Retry-After` header

### Consequences
- **Positive:** No external dependencies, fast, easy to configure
- **Negative:** Not shared across multiple instances (use Redis for scale)
- **Risk:** Rate limits reset on server restart

---

## ADR-007: Sentry for Error Monitoring

**Status:** Accepted  
**Date:** 2026-05-16

### Context
Production errors need to be tracked, grouped, and alerted.

### Decision
- Sentry SDK for client, server, and edge runtimes
- Error boundary integration in `app/error.tsx`
- Replay integration for client-side debugging
- Low sample rates in production (0.1) to control costs

### Consequences
- **Positive:** Real-time error tracking, user impact analysis, performance monitoring
- **Negative:** External dependency, cost at scale
- **Risk:** PII leakage if not configured correctly (maskAllText enabled)

---

## ADR-008: Modular Monolith Architecture with Decoupled DB Schemas

**Status:** Accepted  
**Date:** 2026-06-16

### Context
Aplikasi bertumbuh dengan cepat dan integrasi database lintas modul (seperti relasi fisik prisma `@relation` antara `Post` ke `User`, `OrderItem` ke `Product`, dll.) menyebabkan ketergantungan yang sangat erat (high coupling). Ini menyulitkan pengujian unit terisolasi dan mempersulit potensi ekstraksi layanan ke microservices di masa mendatang.

### Decision
- Restrukturisasi seluruh kode fungsional menjadi modul-modul terisolasi di bawah `/src/modules` (`auth`, `billing`, `catalog`, `content`, `order`, `tenant`).
- Semua kode infrastruktur, ui global, tema, hooks, utilitas dipusatkan di bawah `/src/modules/shared`.
- Lakukan isolasi batas logis melalui gerbang kontrak tunggal `index.ts` (Facade) di setiap modul domain. Seluruh detail implementasi internal disimpan di `actions.ts`.
- Menerapkan linter arsitektur otomatis (`dependency-cruiser`) untuk melarang impor internal lintas modul secara langsung.
- Hilangkan seluruh relasi fisik database (`@relation`) Prisma ORM lintas modul dan ganti dengan query in-memory menggunakan Facade Client modul (misalnya `CatalogClient.getProductsMap`).

### Consequences
- **Positive:** Batas logis domain bisnis yang jelas, kemudahan pemeliharaan kode, pemisahan database modular yang memungkinkan migrasi ke microservices tanpa mengubah modul pemanggil.
- **Negative:** Kueri database in-memory mungkin membutuhkan optimasi fetch massal (bulk fetching) untuk menghindari masalah N+1.
- **Risk:** Pengembang harus disiplin menggunakan Facade Client (`index.ts`) dan dilarang mengimpor file internal modul lain secara langsung.

---

## ADR-009: Event-Driven Design (EDD) via Redis Pub/Sub for Decoupled Module Communication

**Status:** Proposed  
**Date:** 2026-06-16

### Context
Setelah memisahkan skema basis data dan menghapus relasi fisik lintas modul (ADR-008), interaksi antar-modul masih menggunakan panggilan metode sinkron langsung via Facade Client. Hal ini masih menyisakan ketergantungan waktu kompilasi (compile-time dependency) antar-modul (misalnya modul `order` harus mengetahui dan mengimpor Facade modul `billing`). Untuk mencapai pemisahan yang sepenuhnya mandiri (*fully decoupled*), komunikasi antar-modul sebaiknya menggunakan paradigma asinkron berbasis peristiwa (event-driven).

### Decision
- Mengadopsi pola **Event-Driven Design (EDD)** untuk komunikasi lintas-modul yang bersifat reaktif dan asinkron (seperti checkout pesanan, pembaruan status langganan, atau pencatatan analitik).
- Menggunakan **Redis Pub/Sub** sebagai broker pesan (message broker) untuk menerbitkan (*publish*) dan berlangganan (*subscribe*) peristiwa (events) lintas modul.
- Modul pengirim (misal `order`) hanya akan menerbitkan peristiwa ke topik Redis (misal `order.created`) tanpa mengetahui modul mana yang mendengarkannya.
- Modul penerima (misal `billing`) akan berlangganan ke topik tersebut dan mengeksekusi logika bisnisnya secara independen.
- Untuk lingkungan pengembangan lokal, kita memanfaatkan infrastruktur Redis yang sudah terintegrasi dan berjalan di Docker (port 6379).

### Consequences
- **Positive:** Penghapusan ketergantungan langsung antar-modul, memudahkan pembagian kerja tim, dan mempermudah ekstraksi modul menjadi microservices di masa mendatang (cukup mengganti Redis dengan Kafka/RabbitMQ jika diperlukan).
- **Negative:** debugging alur proses menjadi lebih kompleks karena bersifat asinkron, dan potensi kegagalan transaksi terdistribusi harus ditangani secara hati-hati (misal menggunakan retry mechanism).
- **Risk:** Perlunya pemantauan koneksi Redis untuk menjamin pengiriman pesan tidak terputus.
