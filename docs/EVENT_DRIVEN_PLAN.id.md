# Rencana Migrasi: Modular Monolith → Event-Driven Monolith

**Tanggal**: 16 Juni 2026
**Oleh**: Codebase Audit
**Status**: Draft Rencana

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur Saat Ini: Facade Pattern](#2-arsitektur-saat-ini-facade-pattern)
3. [Arsitektur Target: Event-Driven Pattern](#3-arsitektur-target-event-driven-pattern)
4. [Event Bus Infrastructure](#4-event-bus-infrastructure)
5. [Event Contracts](#5-event-contracts)
6. [Matriks Migrasi Event](#6-matriks-migrasi-event)
7. [Pola Request/Reply](#7-pola-requestreply)
8. [Tahapan Migrasi](#8-tahapan-migrasi)
9. [Daftar Lengkap Event per Modul](#9-daftar-lengkap-event-per-modul)
10. [Perubahan Dependency Cruiser](#10-perubahan-dependency-cruiser)
11. [Perubahan Prisma Schema](#11-perubahan-prisma-schema)
12. [Testing Strategy](#12-testing-strategy)
13. [Rollback Plan](#13-rollback-plan)
14. [Timeline & Effort](#14-timeline--effort)

---

## 1. Ringkasan Eksekutif

### Tujuan
Migrasi dari **Facade Pattern** (synchronous direct call antar modul) ke **Event-Driven Design** (asynchronous pub/sub via Redis) untuk mempersiapkan evolusi ke microservices.

### Masalah Saat Ini

| Masalah | Dampak |
|---------|--------|
| **Synchronous coupling** | Semua cross-module call blocking, latency terakumulasi |
| **Circular dependency** | `auth` ↔ `tenant` (via dynamic imports) |
| **Billing overload** | billing modul paling connected (5 modul lain + shared) |
| **Shared bukan pure utility** | `shared/` import domain modules (content, catalog, billing, tenant) |
| **Tight coupling di level transaksi** | `billing` → `auth` untuk affiliate commission dalam satu DB transaction |

### Prinsip Desain

1. **Event-first**: Semua komunikasi cross-module lewat event bus, bukan direct call
2. **Eventually consistent**: Tidak ada transaksi distributed; setiap modul jaga konsistensinya sendiri
3. **Idempotent handlers**: Event handler harus bisa dipanggil ulang tanpa efek ganda
4. **Backward compatible**: Facade tetap jalan sebagai fallback selama transisi
5. **Observable**: Semua event tercatat di log untuk debugging dan tracing

---

## 2. Arsitektur Saat Ini: Facade Pattern

```
┌──────────────────────────────────────────────────────┐
│                   SitusBisnis App                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  auth     │  │ billing  │  │ catalog  │           │
│  │  ────────►│  │ ────────►│  │          │           │
│  │  tenant   │  │ auth     │  │          │           │
│  │           │  │ tenant   │  │          │           │
│  │           │  │ catalog  │  │          │           │
│  │           │  │ content  │  │          │           │
│  │           │  │ order    │  │          │           │
│  └─────┬─────┘  └────┬─────┘  └─────┬────┘           │
│        │              │              │                │
│  ┌─────▼──────────────▼──────────────▼────┐           │
│  │             shared/                      │           │
│  │  (core, utils, ui, hooks, themes)       │           │
│  │  ────► content, catalog, billing, tenant │           │
│  └──────────────────────────────────────────┘           │
│                                                      │
│  Semua panah = synchronous await function call        │
└──────────────────────────────────────────────────────┘
```

### Dependency Graph Saat Ini

```
auth ──dynamic──► tenant
  ▲                  │
  │                  │ dynamic
  │                  ▼
  │               shared ◄──────┐
  │                  │          │
  │           ┌──────┴──────┐   │
  │           ▼             ▼   │
  │       content        catalog │
  │           │               │
  │           ▼               ▼
  │         billing ──────────► order
  │            │
  └────────────┘

billing ──► auth, tenant, catalog, content, order, shared
content ──► auth, catalog, billing, shared
order    ──► catalog, shared
tenant   ──► auth (dynamic), shared
shared   ──► content, catalog, billing, tenant
```

### Total Cross-Module Calls

| Asal → Tujuan | Jumlah Call | Sifat |
|---------------|-------------|-------|
| billing → auth | 6 files, 12+ calls | Sync (beberapa fire-and-forget) |
| billing → tenant | 3 files, 7+ calls | Sync |
| billing → catalog | 1 file, 1 call | Sync (limit check) |
| billing → content | 1 file, 3 calls | Sync (limit check) |
| billing → order | 1 file, 1 call | Sync (limit check) |
| billing → shared | 8 files | Sync (db access) |
| content → auth | 1 file, 1 call | Sync |
| content → catalog | 1 file, 1 call | Sync |
| content → billing | 1 file, 2 calls | Sync |
| content → shared | 7 files | Sync (db access) |
| order → catalog | 1 file, 1 call | Sync (dynamic import) |
| auth → tenant | 1 file, 3 calls | Sync (dynamic import) |
| tenant → auth | 1 file, 1 call | Sync (dynamic import) |
| shared → content | 2 files, 8+ calls | Sync |
| shared → catalog | 1 file, 2 calls | Sync |
| shared → billing | 1 file, 1 call | Sync |
| shared → tenant | 1 file, 4 calls | Sync |

---

## 3. Arsitektur Target: Event-Driven Pattern

```
┌──────────────────────────────────────────────────────────────────┐
│                     SitusBisnis App (Event-Driven)                 │
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  auth     │    │ billing  │    │ catalog  │                   │
│  │  publish ◄┐   │ publish ◄┐   │ publish ◄┐                    │
│  │  subscribe││   │ subscribe││   │ subscribe││                   │
│  └─────┬─────┘│   └────┬────┘│   └────┬────┘│                   │
│        │      │         │     │        │     │                    │
│  ┌─────▼──────▼─────────▼─────▼────────▼─────▼──────┐            │
│  │               REDIS PUB/SUB (Event Bus)            │           │
│  │  • order.placed        • payment.completed         │           │
│  │  • subscription.changed  • domain.verified          │           │
│  │  • site.created         • media.uploaded            │           │
│  │  • user.registered      • limit.exceeded            │           │
│  └─────────────────────────────────────────────────────┘           │
│        │      ▲         │     ▲        │     ▲                    │
│  ┌─────▼──────┴──┐  ┌──▼─────┴───┐  ┌─▼──────┴────┐              │
│  │  content      │  │  order      │  │  tenant     │              │
│  │  publish ◄┐   │  │  publish ◄┐ │  │  publish  ◄┐              │
│  │  subscribe││   │  │  subscribe││ │  subscribe ││              │
│  └───────────┘│   │  └──────────┘│  └────────────┘│              │
│               │   │              │                 │              │
│  ┌────────────▼───▼────────────────▼────────────────▼──┐          │
│  │                 shared/ (READ ONLY no domain dep)     │          │
│  │  (core: db, redis, logger, env | utils | ui | hooks)  │          │
│  │  ⚠️ HARAM import domain modules dari shared/           │          │
│  └────────────────────────────────────────────────────────┘          │
│                                                                  │
│  Semua panah horizontal = publish/subscribe via Redis            │
│  Semua panah vertikal   = handler memproses event                │
└──────────────────────────────────────────────────────────────────┘
```

### Prinsip Perubahan

| Aspek | Facade (Sekarang) | Event-Driven (Target) |
|-------|-------------------|-----------------------|
| Komunikasi | `BillingClient.method()` langsung | `eventBus.publish('event.name', payload)` |
| Coupling | Compile-time (import) | Runtime (event contract) |
| Consistency | Strong (1 DB transaction) | Eventual (Saga pattern) |
| Latency | Synchronous (blocking) | Asynchronous (non-blocking) |
| Scalability | Monolith only | Bisa di-extract ke microservice |
| Observability | Log per-call | Event log + tracing |
| Error handling | Try/catch langsung | Retry + dead letter queue |
| Testing | Mock facade | Mock event bus |

---

## 4. Event Bus Infrastructure

### 4.1 Arsitektur Event Bus

```
┌──────────────────────────────────────────────┐
│              EventBus Class                    │
│                                                │
│  publish(event, payload) → void               │
│  subscribe(event, handler) → unsubscribe fn   │
│  request(event, payload, timeout) → Promise   │
│  reply(event, handler) → void                 │
│  onError(handler) → void                      │
│                                                │
│  ┌────────────────────────────┐                │
│  │     Redis Pub/Sub Layer    │                │
│  │  redis.publish(ch, msg)    │                │
│  │  redis.subscribe(ch, fn)   │                │
│  └────────────────────────────┘                │
└──────────────────────────────────────────────┘
```

### 4.2 File yang Dibuat

```
src/modules/shared/core/
├── event-bus.ts           # EventBus class (publish/subscribe/request/reply)
├── event-types.ts         # Event contract definitions & payload types
├── event-store.ts         # Outbox pattern untuk reliability
└── event-errors.ts        # Error types untuk event handling

src/modules/shared/core/__tests__/
├── event-bus.test.ts
├── event-store.test.ts
└── event-types.test.ts
```

### 4.3 Interface EventBus

```typescript
// src/modules/shared/core/event-bus.ts

export type EventHandler<T = unknown> = (payload: T, metadata: EventMetadata) => Promise<void>;

export interface EventMetadata {
  eventId: string;          // UUID v7
  eventName: string;
  sourceModule: string;
  timestamp: number;        // unix ms
  correlationId: string;    // tracing
  causationId?: string;     // parent event
  retryCount: number;
}

export interface EventPayload<T = unknown> {
  data: T;
  metadata: EventMetadata;
}

export interface EventBus {
  // Fire-and-forget: publish event, no response expected
  publish<T>(eventName: string, data: T, sourceModule: string): Promise<void>;

  // Subscribe to event
  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void;

  // Request/Reply: publish event and wait for response
  request<T, R>(eventName: string, data: T, timeout?: number): Promise<R>;

  // Reply handler for request events
  reply<T, R>(eventName: string, handler: (data: T) => Promise<R>): () => void;

  // Graceful shutdown
  disconnect(): Promise<void>;
}
```

### 4.4 Implementasi Redis

```typescript
// Pseudocode implementasi

class RedisEventBus implements EventBus {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, Set<EventHandler>>;
  private pendingRequests: Map<string, { resolve, reject, timer }>;

  async publish<T>(eventName: string, data: T, sourceModule: string): Promise<void> {
    const payload: EventPayload<T> = {
      data,
      metadata: {
        eventId: crypto.randomUUID(),
        eventName,
        sourceModule,
        timestamp: Date.now(),
        correlationId: this.currentCorrelationId,
        retryCount: 0,
      },
    };

    // Publish ke Redis channel
    // Channel naming: `event:${eventName}`
    await this.publisher.publish(`event:${eventName}`, JSON.stringify(payload));

    // Log event untuk observability
    logger.info({ eventName, sourceModule, eventId: payload.metadata.eventId }, 'Event published');
  }

  async subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    // Subscribe ke Redis channel
    // Register handler di local map
    // Return unsubscribe function
  }

  async request<T, R>(eventName: string, data: T, timeout = 5000): Promise<R> {
    // Generate unique reply channel: `reply:${eventName}:${correlationId}`
    // Subscribe ke reply channel
    // Publish event dengan replyTo metadata
    // Wait for response or timeout
  }

  async reply<T, R>(eventName: string, handler: (data: T) => Promise<R>): () => void {
    // Subscribe ke request channel
    // Call handler, publish response ke reply channel
  }
}
```

### 4.5 Outbox Pattern (Event Store)

Untuk reliability, setiap publish harus melalui **outbox pattern**:

```
Modul → INSERT ke event_outbox (DB) → Outbox Publisher → Redis → Subscriber
                              ↑                            │
                              └──── Replay on failure ─────┘
```

**Prisma model**:

```prisma
model EventOutbox {
  id          String   @id @default(cuid())
  eventName   String
  payload     Json
  sourceModule String
  status      EventStatus @default(pending)  // pending | published | failed
  createdAt   DateTime @default(now())
  publishedAt DateTime?
  retryCount  Int      @default(0)
  error       String?
}

enum EventStatus {
  pending
  published
  failed
}
```

**Outbox Publisher** (background job via `setInterval` atau cron):

```typescript
// Periodically:
// 1. SELECT * FROM EventOutbox WHERE status = 'pending' ORDER BY createdAt ASC LIMIT 50
// 2. Publish each event ke Redis
// 3. UPDATE status = 'published' WHERE id = ?
// 4. Retry failed events with exponential backoff
```

### 4.6 Event Naming Convention

```
{domain}.{entity}.{action}[.{modifier}]

Contoh:
order.placed                # Pesanan baru dibuat
order.payment.confirmed     # Pembayaran pesanan dikonfirmasi
billing.subscription.changed # Status langganan berubah
tenant.site.created         # Situs baru dibuat
user.registered             # User baru daftar
content.media.uploaded      # Media diupload
domain.verified             # Domain terverifikasi
limit.exceeded              # Batas penggunaan terlampaui
```

### 4.7 Retry & Dead Letter Queue

```
Event Handler Error
       │
       ▼
┌──────────────────────┐
│ retryCount < maxRetry│────yes───► Re-publish with backoff
└──────────┬───────────┘
           │ no
           ▼
┌──────────────────────┐
│  Dead Letter Channel │
│  event:dead.{name}   │
└──────────┬───────────┘
           ▼
     Log & Alert
```

---

## 5. Event Contracts

### 5.1 Event Type Definitions

```typescript
// src/modules/shared/core/event-types.ts

// ─── Auth Events ────────────────────────────────────
export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string;
  referralCode?: string;
  referredById?: string;
}

export interface AffiliateCommissionAwardedEvent {
  transactionId: string;
  affiliateId: string;
  amount: number;
  orderId: string;
}

export interface AffiliateWithdrawalRequestedEvent {
  withdrawalId: string;
  userId: string;
  amount: number;
  bankAccount: string;
}

// ─── Billing Events ──────────────────────────────────
export interface PaymentCompletedEvent {
  transactionId: string;
  siteId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  planName: string;
  billingPeriod: 'monthly' | 'yearly';
}

export interface SubscriptionChangedEvent {
  siteId: string;
  userId: string;
  oldPlan: string | null;
  newPlan: string;
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'trial_start' | 'trial_end';
}

export interface CouponAppliedEvent {
  couponId: string;
  userId: string;
  transactionId: string;
  discountAmount: number;
}

export interface TrialExtendedEvent {
  siteId: string;
  userId: string;
  extendedDays: number;
  newTrialEnd: string; // ISO date
}

// ─── Order Events ────────────────────────────────────
export interface OrderPlacedEvent {
  orderId: string;
  siteId: string;
  userId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
}

export interface OrderPaymentConfirmedEvent {
  orderId: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
}

export interface OrderFulfilledEvent {
  orderId: string;
  siteId: string;
  status: 'shipped' | 'completed' | 'cancelled';
}

// ─── Content Events ──────────────────────────────────
export interface MediaUploadedEvent {
  mediaId: string;
  siteId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderId?: string;
}

export interface PostPublishedEvent {
  postId: string;
  siteId: string;
  authorId: string;
  slug: string;
  title: string;
}

// ─── Tenant Events ───────────────────────────────────
export interface SiteCreatedEvent {
  siteId: string;
  userId: string;
  subdomain: string;
  planName: string;
}

export interface SiteDeletedEvent {
  siteId: string;
  userId: string;
  subdomain: string;
}

export interface DomainVerifiedEvent {
  siteId: string;
  domain: string;
  verifiedAt: string;
}

export interface ContactSubmittedEvent {
  siteId: string;
  contactId: string;
  name: string;
  email: string;
  message: string;
}

// ─── Limit/Quota Events ─────────────────────────────
export interface LimitExceededEvent {
  siteId: string;
  userId: string;
  limitType: 'maxPosts' | 'maxProducts' | 'maxAssets' | 'maxStorage' | 'maxSites';
  currentValue: number;
  maxAllowed: number;
}

export interface SiteQuotaUpdatedEvent {
  siteId: string;
  planName: string;
  quotas: Record<string, number>;
}

// ─── Event Map (for type safety) ─────────────────────
export interface EventMap {
  'user.registered': UserRegisteredEvent;
  'affiliate.commission.awarded': AffiliateCommissionAwardedEvent;
  'affiliate.withdrawal.requested': AffiliateWithdrawalRequestedEvent;
  'billing.payment.completed': PaymentCompletedEvent;
  'billing.subscription.changed': SubscriptionChangedEvent;
  'billing.coupon.applied': CouponAppliedEvent;
  'billing.trial.extended': TrialExtendedEvent;
  'order.placed': OrderPlacedEvent;
  'order.payment.confirmed': OrderPaymentConfirmedEvent;
  'order.fulfilled': OrderFulfilledEvent;
  'content.media.uploaded': MediaUploadedEvent;
  'content.post.published': PostPublishedEvent;
  'tenant.site.created': SiteCreatedEvent;
  'tenant.site.deleted': SiteDeletedEvent;
  'tenant.domain.verified': DomainVerifiedEvent;
  'tenant.contact.submitted': ContactSubmittedEvent;
  'limit.exceeded': LimitExceededEvent;
  'billing.quota.updated': SiteQuotaUpdatedEvent;
}

// ─── Request/Reply Contracts ─────────────────────────
// Untuk query yang butuh return value

export interface RequestMap {
  // auth requests
  'request.user.get': { userId: string } => { name: string; email: string; role: string } | null;
  'request.user.getSiteOwner': { siteId: string } => { id: string; name: string; email: string } | null;

  // tenant requests
  'request.tenant.getSiteInfo': { siteId: string } => { name: string; subdomain: string; plan: string } | null;
  'request.tenant.getSiteSettings': { siteId: string } => Record<string, unknown>;
  'request.tenant.verifyAccess': { userId: string; siteId: string } => boolean;

  // billing requests
  'request.billing.checkLimit': { siteId: string; limitType: string } => { allowed: boolean; current: number; max: number };
  'request.billing.getActivePlan': { siteId: string } => { name: string; quotas: Record<string, number> } | null;

  // catalog requests
  'request.catalog.countProducts': { siteId: string } => number;
  'request.catalog.getProductsMap': { productIds: string[] } => Record<string, { name: string; price: number }>;

  // content requests
  'request.content.countPosts': { siteId: string } => number;
  'request.content.countTestimonials': { siteId: string } => number;
  'request.content.getMediaSize': { siteId: string } => number;

  // order requests
  'request.order.countOrders': { siteId: string } => number;
}
```

### 5.2 Event Documentation Format

Setiap event harus didokumentasikan dalam format:

```markdown
## `billing.payment.completed`

**Publisher**: billing module
**Subscribers**: auth (affiliate commission), tenant (notifikasi), order (fulfillment)
**Type**: Fire-and-forget
**Idempotent**: Yes (key: transactionId)
**Payload**:
```typescript
{
  transactionId: string;
  siteId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  planName: string;
  billingPeriod: 'monthly' | 'yearly';
}
```
```

---

## 6. Matriks Migrasi Event

### 6.1 Klasifikasi Cross-Module Calls

Setiap cross-module call saat ini diklasifikasikan menjadi:

| Tipe | Deskripsi | Strategi |
|------|-----------|----------|
| **Fire-and-forget** | Caller tidak butuh return value | `publish()` langsung |
| **Request/Reply** | Caller butuh data kembali | `request()` menunggu reply |
| **Limit Check** | Cek kuota sebelum aksi | `request()` via billing |
| **Notification** | WA/Email/notifikasi | `publish()` fire-and-forget |
| **Enrichment** | Caller butuh data tambahan | `request()` atau cache |

### 6.2 Mapping Lengkap

#### A. billing → auth

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `IdentityClient.getSiteOwner(siteId)` | `request.auth.getSiteOwner` | Request/Reply |
| `IdentityClient.awardAffiliateCommission(...)` | `affiliate.commission.awarded` | Fire-and-forget |
| `IdentityClient.getUsersMap(ids)` | `request.auth.getUsersMap` | Request/Reply |
| `IdentityClient.getUserById(id)` | `request.auth.getUserById` | Request/Reply |
| `IdentityClient.updateUserReferrer(...)` | `user.referrer.updated` | Fire-and-forget |

#### B. billing → tenant

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `TenantClient.getSiteInfo(siteId)` | `request.tenant.getSiteInfo` | Request/Reply |
| `TenantClient.getSiteContact(siteId)` | `request.tenant.getSiteContact` | Request/Reply |
| `TenantClient.verifyUserSiteAccess(userId, siteId)` | `request.tenant.verifyAccess` | Request/Reply |

#### C. billing → catalog / content / order (Limit Checks)

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `CatalogClient.countProducts(siteId)` | `request.catalog.countProducts` | Request/Reply |
| `ContentClient.countPosts(siteId)` | `request.content.countPosts` | Request/Reply |
| `ContentClient.countTestimonials(siteId)` | `request.content.countTestimonials` | Request/Reply |
| `ContentClient.getMediaSize(siteId)` | `request.content.getMediaSize` | Request/Reply |
| `OrderClient.countOrders(siteId)` | `request.order.countOrders` | Request/Reply |

#### D. billing → billing internal events

| Event Baru | Trigger | Subscribers |
|------------|---------|-------------|
| `billing.payment.completed` | Transaction approved | auth (affiliate), tenant (notif) |
| `billing.subscription.changed` | Plan upgrade/downgrade/cancel | tenant, content (quota) |
| `billing.trial.extended` | Trial diperpanjang | tenant (notif) |
| `billing.quota.updated` | Plan change → quota update | tenant, content, catalog, order |
| `billing.coupon.applied` | Coupon digunakan | auth (affiliate tracking) |

#### E. content → auth / catalog / billing

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `IdentityClient.getUserById(post.authorId)` | `request.auth.getUserById` | Request/Reply |
| `CatalogClient.searchProducts(siteId, q)` | `request.catalog.searchProducts` | Request/Reply |
| `BillingClient.getActiveSubscription(siteId)` | `request.billing.getActivePlan` | Request/Reply |
| `BillingClient.checkSiteLimit(siteId, type)` | `request.billing.checkLimit` | Request/Reply |

#### F. order → catalog

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `CatalogClient.getProductsMap(productIds)` | `request.catalog.getProductsMap` | Request/Reply |
| `CatalogClient.getProduct(slug, id)` | `request.catalog.getProduct` | Request/Reply |

#### G. order → billing

| Event Baru | Trigger | Subscribers |
|------------|---------|-------------|
| `order.placed` | Order baru dibuat | billing (limit check async) |
| `order.payment.confirmed` | Payment dikonfirmasi | billing (affiliate commission trigger) |

#### H. auth → tenant

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `TenantClient.(removeDomain|registerDomain|verifyDomain)` | `request.tenant.domainAction` | Request/Reply |
| Atau via event: `tenant.domain.verified` | Domain diverifikasi | Fire-and-forget |

#### I. tenant → auth

| Call Saat Ini | Event/Request | Tipe |
|---------------|---------------|------|
| `IdentityClient.getSiteOwner(siteId)` | `request.auth.getSiteOwner` | Request/Reply |

#### J. shared → domain modules (HARUS DIHAPUS)

**Ini adalah pelanggaran arsitektur.** `shared/` tidak boleh import domain modules.

| File | Import | Solusi |
|------|--------|--------|
| `shared/utils/services/content.service.ts` | `ContentClient`, `CatalogClient` | Pindahkan ke `content/services/content-display.service.ts` |
| `shared/utils/content/menus.ts` | `ContentClient` | Pindahkan ke `content/services/menu.service.ts` |
| `shared/utils/services/email.ts` | `tenant` | Pindahkan ke `tenant/services/email.service.ts` |
| `shared/utils/settings/site.ts` | `TenantClient` | Pindahkan ke `tenant/services/site-settings.service.ts` |
| `shared/utils/api/crud-handler.ts` | `BillingClient` | Inject event bus, publish `request.billing.checkLimit` |
| `shared/utils/services/backup.service.ts` | `tenant` | Pindahkan ke `tenant/services/backup.service.ts` |

---

## 7. Pola Request/Reply

### 7.1 Flow Request/Reply

Untuk query yang butuh return value, kita gunakan **Redis pub/sub request/reply pattern**:

```
Caller                              EventBus                            Responder
  │                                    │                                    │
  │  request('req.xxx.get', payload)   │                                    │
  │ ─────────────────────────────────► │                                    │
  │                                    │  subscribe('req.xxx.get')         │
  │                                    │ ─────────────────────────────────► │
  │                                    │                                    │
  │                                    │  publish(`reply:${correlationId}`) │
  │                                    │ ◄───────────────────────────────── │
  │  resolve(response)                │                                    │
  │ ◄───────────────────────────────── │                                    │
```

### 7.2 Implementasi

```typescript
// Publisher (Caller)
const siteOwner = await eventBus.request<{ siteId: string }, { id: string; name: string; email: string }>(
  'request.auth.getSiteOwner',
  { siteId: 'abc123' },
  { timeout: 5000 }
);

// Handler (Responder - di module auth)
eventBus.reply<{ siteId: string }, { id: string; name: string; email: string }>(
  'request.auth.getSiteOwner',
  async ({ siteId }) => {
    const site = await db.site.findUnique({
      where: { id: siteId },
      include: { siteUsers: { where: { role: 'owner' }, include: { user: true } } },
    });
    if (!site?.siteUsers[0]) return null;
    return { id: site.siteUsers[0].user.id, name: site.siteUsers[0].user.name!, email: site.siteUsers[0].user.email! };
  }
);
```

### 7.3 Timeout & Fallback

Setiap `request()` punya timeout (default 5 detik). Jika timeout:
1. Throw `EventTimeoutError`
2. Caller harus handle dengan fallback (gunakan cache atau facade fallback)

```typescript
try {
  const result = await eventBus.request('request.xxx.get', payload, { timeout: 5000 });
  return result;
} catch (err) {
  if (err instanceof EventTimeoutError) {
    logger.warn({ eventName }, 'Request timed out, using fallback');
    return getFromCache(key) ?? null;
  }
  throw err;
}
```

### 7.4 Cache Layer

Untuk request yang sering dipanggil (seperti `getSiteOwner`, `getSiteInfo`), implementasikan **cache** untuk mengurangi latency:

```
request('request.xxx.get', payload)
    │
    ├── Cache hit? ──yes──► return cached
    │
    └── Cache miss? ──no──► publish request
                ┌──────────────────────┐
                │  Save ke cache       │
                │  TTL: 60 detik       │
                └──────────────────────┘
                │
                ▼
            return response
```

---

## 8. Tahapan Migrasi

### Phase 0: Persiapan (Estimated: 3-5 hari)

**Goal**: Event bus infrastructure siap

```
Task 0.1: Install dependencies
- Pastikan ioredis sudah terinstall ✅ (already in package.json)

Task 0.2: Buat event bus core
- src/modules/shared/core/event-bus.ts
- src/modules/shared/core/event-types.ts
- src/modules/shared/core/event-store.ts
- Unit tests

Task 0.3: Buat outbox model di Prisma
- Model EventOutbox + enum EventStatus
- npx prisma migrate dev

Task 0.4: Buat outbox publisher
- Background job untuk publish pending events
- Retry mechanism

Task 0.5: Update dependency-cruiser rules
- Tambah rule: shared tidak boleh import domain modules
- Tambah rule: event bus hanya via shared/core/event-bus.ts

Task 0.6: Buat event bus singleton
- Integrasi dengan getRedis() yang sudah ada
- Graceful shutdown handler
```

**Deliverable**: `EventBus` class functional, test coverage >80%, dependency-cruiser updated.

---

### Phase 1: Fire-and-Forget Events (Estimated: 5-7 hari)

**Goal**: Semua notifikasi dan side-effect pindah ke event

**Pilih satu flow sederhana sebagai pilot** — misalnya:

#### Pilot: `billing.payment.completed` → WhatsApp/Email notification

```
Step 1: billing module publish event
  Setelah transaction.approved():
    await eventBus.publish('billing.payment.completed', {
      transactionId, siteId, userId, amount, paymentMethod, planName, billingPeriod
    }, 'billing');

Step 2: tenant module subscribe event
  eventBus.subscribe('billing.payment.completed', async (payload) => {
    await sendWhatsAppNotification(payload.userId, `Pembayaran Rp${payload.amount} diterima!`);
    await sendEmailNotification(payload.userId, 'Pembayaran Sukses', template);
  });

Step 3: Dual-run
  - billing tetap panggil facade notification OLD
  - billing juga publish event NEW
  - tenant subscribe event
  - Compare results selama 1-2 hari
  - Setelah stabil, hapus facade notification call
```

**Flow lain di phase ini:**

| Prioritas | Event | Publisher | Subscriber | Fire-and-forget? |
|-----------|-------|-----------|------------|------------------|
| 1 | `billing.payment.completed` | billing | tenant (notif), auth (affiliate) | ✅ |
| 2 | `billing.subscription.changed` | billing | tenant (notif), content (quota) | ✅ |
| 3 | `billing.trial.extended` | billing | tenant (notif) | ✅ |
| 4 | `user.registered` | auth | tenant (notif) | ✅ |
| 5 | `tenant.contact.submitted` | tenant | email/notif handler | ✅ |
| 6 | `content.media.uploaded` | content | tenant (statistics) | ✅ |
| 7 | `content.post.published` | content | tenant (sitemap rebuild) | ✅ |
| 8 | `tenant.site.created` | tenant | billing (trial init) | ✅ |
| 9 | `tenant.site.deleted` | tenant | billing (cleanup) | ✅ |

**Verifikasi**: Semua fire-and-forget events berjalan di staging. Log monitoring menunjukkan semua event terpublish dan ter-consume.

---

### Phase 2: Request/Reply Events (Estimated: 5-7 hari)

**Goal**: Semua query data cross-modul pindah ke request/reply

#### Pilot: Limit Checks

Limit check adalah kandidat bagus karena:
- Semua limit check terpusat di `billing/services/limit.service.ts`
- Return value sederhana (number atau {allowed, current, max})
- Bisa di-cache dengan mudah

```
Step 1: Define request contracts
  'request.catalog.countProducts': { siteId } => number
  'request.content.countPosts': { siteId } => number
  'request.content.countTestimonials': { siteId } => number
  'request.content.getMediaSize': { siteId } => number
  'request.order.countOrders': { siteId } => number

Step 2: Billing publish request
  billing/services/limit.service.ts:
    - Hapus import CatalogClient, ContentClient, OrderClient
    - Ganti dengan eventBus.request('request.xxx', { siteId })

Step 3: Catalog/Content/Order reply
  - Masing-masing module register reply handler:
    eventBus.reply('request.catalog.countProducts', handler)

Step 4: Dual-run
  - billing tetap punya facade fallback
  - billing juga via eventBus.request dengan timeout pendek (2s)
  - Jika timeout, fallback ke facade
```

**Flow lain di phase ini:**

| Prioritas | Request | Responder | Caller |
|-----------|---------|-----------|--------|
| 1 | `request.catalog.countProducts` | catalog | billing (limit check) |
| 2 | `request.content.countPosts` | content | billing (limit check) |
| 3 | `request.content.countTestimonials` | content | billing (limit check) |
| 4 | `request.content.getMediaSize` | content | billing (limit check) |
| 5 | `request.order.countOrders` | order | billing (limit check) |
| 6 | `request.auth.getSiteOwner` | auth | billing, tenant, content |
| 7 | `request.auth.getUserById` | auth | content, billing |
| 8 | `request.auth.getUsersMap` | auth | billing |
| 9 | `request.tenant.getSiteInfo` | tenant | billing |
| 10 | `request.tenant.getSiteContact` | tenant | billing |
| 11 | `request.tenant.verifyAccess` | tenant | billing |
| 12 | `request.catalog.getProductsMap` | catalog | order |
| 13 | `request.catalog.getProduct` | catalog | content |
| 14 | `request.billing.checkLimit` | billing | content, shared/crud-handler |
| 15 | `request.billing.getActivePlan` | billing | content |

**Verifikasi**: Semua request/reply pattern jalan dengan timeout <100ms (in-process Redis). Cache layer untuk hot data.

---

### Phase 3: Shared Module Cleanup (Estimated: 3-5 hari)

**Goal**: `shared/` jadi pure utility tanpa dependensi domain module

```
Step 1: Pindahkan shared/utils/services/content.service.ts
  → content/services/content-display.service.ts

Step 2: Pindahkan shared/utils/content/menus.ts
  → content/services/menu.service.ts

Step 3: Pindahkan shared/utils/settings/site.ts
  → tenant/services/site-settings.service.ts

Step 4: Pindahkan shared/utils/services/email.ts
  → tenant/services/email.service.ts

Step 5: Pindahkan shared/utils/services/backup.service.ts
  → tenant/services/backup.service.ts

Step 6: Update shared/utils/api/crud-handler.ts
  - Hapus import BillingClient
  - Gunakan eventBus.request('request.billing.checkLimit', ...)

Step 7: Update dependency-cruiser
  - Tambah rule strict: shared/ TIDAK BOLEH import domain modules
  - Block semua pelanggaran sebagai error
```

**Deliverable**: `shared/` zero imports dari domain modules. Dependency-cruiser lolos.

---

### Phase 4: Circular Dependency Resolution (Estimated: 2-3 hari)

**Goal**: Hapus circular dependency `auth` ↔ `tenant`

```
Step 1: auth → tenant
  - auth/services/auth.service.ts panggil TenantClient untuk domain ops
  - Ganti dengan event 'tenant.domain.action' (request/reply)

Step 2: tenant → auth
  - tenant/services/domain.service.ts panggil IdentityClient.getSiteOwner
  - Ganti dengan request 'request.auth.getSiteOwner'

Step 3: Hapus dynamic imports
  - auth: hapus import("@/modules/tenant")
  - tenant: hapus import("@/modules/auth")
```

---

### Phase 5: Facade Deprecation (Estimated: 3-5 hari)

**Goal**: Hapus semua facade cross-module, hanya event bus

```
Step 1: Audit all facade usage
  - Cari semua import { XxxClient } from "@/modules/xxx"
  - Pastikan setiap usage sudah diganti dengan eventBus

Step 2: Hapus facade clients
  - Setiap module hapus index.ts facade export untuk cross-module
  - Simpan hanya untuk public API yang dipakai oleh app/api/ (thin controller)

Step 3: Final dependency-cruiser check
  - Tidak ada cross-module import di domain modules selain shared/core/event-bus.ts
```

---

### Phase 6: Microservices Readiness (Estimated: 5-7 hari)

**Goal**: Setiap module siap diekstrak jadi service terpisah

```
Step 1: Module boundary verification
  - Setiap module hanya punya: Prisma schema subset, event handlers, own DB connection
  - Tidak ada shared DB access antar module

Step 2: Event bus independence
  - Setiap module bisa jalan standalone dengan Redis connection sendiri

Step 3: Containerization
  - Dockerfile per module
  - Module bisa di-deploy sebagai service terpisah

Step 4: Migration dry-run
  - Extract 1 module (misal: catalog) jadi service terpisah
  - Test komunikasi via Redis event bus
  - Rollback jika gagal
```

---

## 9. Daftar Lengkap Event per Modul

### 9.1 Modul Auth

**Publish:**
| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `user.registered` | User baru daftar | tenant (notif), billing (trial) |
| `user.referrer.updated` | Referral code applied | billing (affiliate tracking) |
| `affiliate.commission.awarded` | Komisi diberikan | tenant (notif) |
| `affiliate.withdrawal.requested` | Withdrawal diajukan | admin (notif) |

**Subscribe:**
| Event | Handler |
|-------|---------|
| `billing.payment.completed` | Award affiliate commission |
| `billing.coupon.applied` | Track affiliate coupon usage |

**Reply (Request/Reply):**
| Request | Return |
|---------|--------|
| `request.auth.getSiteOwner` | Site owner info |
| `request.auth.getUserById` | User info |
| `request.auth.getUsersMap` | Users map by IDs |

### 9.2 Modul Billing

**Publish:**
| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `billing.payment.completed` | Payment approved | auth (affiliate), tenant (notif) |
| `billing.subscription.changed` | Plan changed | tenant (quota), content (quota) |
| `billing.trial.extended` | Trial extended | tenant (notif) |
| `billing.coupon.applied` | Coupon used | auth (affiliate tracking) |
| `billing.quota.updated` | Quota recalculated | all modules (cache flush) |

**Subscribe:**
| Event | Handler |
|-------|---------|
| `order.placed` | Check order quota |
| `tenant.site.created` | Init trial subscription |
| `tenant.site.deleted` | Cleanup billing data |

**Reply (Request/Reply):**
| Request | Return |
|---------|--------|
| `request.billing.checkLimit` | Limit check result |
| `request.billing.getActivePlan` | Active plan info |

### 9.3 Modul Catalog

**Publish:**
| Event | Trigger |
|-------|---------|
| `catalog.product.created` | Product baru |
| `catalog.product.updated` | Product diupdate |
| `catalog.product.deleted` | Product dihapus |

**Subscribe:**
- Tidak ada (pure data provider)

**Reply:**
| Request | Return |
|---------|--------|
| `request.catalog.countProducts` | Product count |
| `request.catalog.getProductsMap` | Products by IDs |
| `request.catalog.getProduct` | Single product |

### 9.4 Modul Content

**Publish:**
| Event | Trigger |
|-------|---------|
| `content.media.uploaded` | File diupload |
| `content.post.published` | Post dipublish |
| `content.post.deleted` | Post dihapus |

**Subscribe:**
| Event | Handler |
|-------|---------|
| `billing.subscription.changed` | Update quota limits |
| `billing.quota.updated` | Refresh quota cache |

**Reply:**
| Request | Return |
|---------|--------|
| `request.content.countPosts` | Post count |
| `request.content.countTestimonials` | Testimonial count |
| `request.content.getMediaSize` | Total media size |

### 9.5 Modul Order

**Publish:**
| Event | Trigger |
|-------|---------|
| `order.placed` | Order baru | billing (quota check), tenant (notif) |
| `order.payment.confirmed` | Payment confirmed | billing (affiliate trigger) |
| `order.fulfilled` | Order selesai | tenant (notif) |

**Subscribe:**
- Tidak ada (pure data provider)

**Reply:**
| Request | Return |
|---------|--------|
| `request.order.countOrders` | Order count |

### 9.6 Modul Tenant

**Publish:**
| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `tenant.site.created` | Site baru | billing (trial init) |
| `tenant.site.deleted` | Site dihapus | billing (cleanup) |
| `tenant.domain.verified` | Domain verified | auth (notification) |
| `tenant.contact.submitted` | Contact form | email/notif handler |

**Subscribe:**
| Event | Handler |
|-------|---------|
| `billing.payment.completed` | Send notification |
| `billing.subscription.changed` | Update site branding |
| `billing.trial.extended` | Update trial end date |

**Reply:**
| Request | Return |
|---------|--------|
| `request.tenant.getSiteInfo` | Site info |
| `request.tenant.getSiteContact` | Site contact |
| `request.tenant.verifyAccess` | Access check |
| `request.tenant.getSiteSettings` | Site settings |

---

## 10. Perubahan Dependency Cruiser

### 10.1 Aturan Baru

```json
{
  "forbidden": [
    // Existing: no-cross-module-internal-imports
    {
      "name": "no-cross-module-internal-imports"
      // ... (unchanged)
    },

    // Existing: no-outside-internal-imports
    {
      "name": "no-outside-internal-imports"
      // ... (unchanged)
    },

    // NEW: shared module cannot import domain modules
    {
      "name": "no-shared-domain-imports",
      "comment": "Shared module tidak boleh bergantung pada domain modules. Pindahkan ke modul domain terkait.",
      "severity": "error",
      "from": {
        "path": "^src/modules/shared/"
      },
      "to": {
        "path": "^src/modules/(auth|billing|catalog|content|order|tenant)/"
      }
    },

    // NEW: no direct facade imports between modules
    // (all domain modules must use event bus instead of direct imports)
    {
      "name": "no-domain-to-domain-imports",
      "comment": "Domain modules tidak boleh saling import langsung. Gunakan event bus (publish/subscribe/request/reply).",
      "severity": "error",
      "from": {
        "path": "^src/modules/(auth|billing|catalog|content|order|tenant)/"
      },
      "to": {
        "path": "^src/modules/(auth|billing|catalog|content|order|tenant)/.+",
        "pathNot": "^src/modules/shared/"
      }
    }
  ]
}
```

### 10.2 Transisi Aturan

| Phase | Aturan Aktif | Keterangan |
|-------|-------------|------------|
| Sekarang | no-cross-module-internal, no-outside-internal | Facade diperbolehkan |
| Phase 1-2 | + no-shared-domain-imports (warning) | Shared cleanup mulai |
| Phase 3 | + no-shared-domain-imports (error) | Shared wajib bersih |
| Phase 4 | + no-domain-to-domain-imports (warning) | Mulai blok facade |
| Phase 5-6 | + no-domain-to-domain-imports (error) | Hanya event bus |

---

## 11. Perubahan Prisma Schema

### 11.1 Outbox Model

```prisma
// Tambahkan di schema.prisma

model EventOutbox {
  id            String            @id @default(cuid())
  eventName     String
  payload       Json
  sourceModule  String
  correlationId String?
  status        EventOutboxStatus @default(pending)
  retryCount    Int               @default(0)
  lastError     String?
  createdAt     DateTime          @default(now())
  publishedAt   DateTime?
  processedAt   DateTime?
}

enum EventOutboxStatus {
  pending
  publishing
  published
  failed
  dead_letter
}
```

### 11.2 Migrasi DB

```bash
npx prisma migrate dev --name add_event_outbox
```

### 11.3 Dead Letter Queue Model (Optional)

```prisma
model DeadLetterEvent {
  id            String   @id @default(cuid())
  eventName     String
  payload       Json
  sourceModule  String
  error         String
  retryCount    Int
  failedAt      DateTime @default(now())
  resolvedAt    DateTime?
  resolution    String?  // 'retried' | 'ignored' | 'fixed'
}
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

```typescript
// event-bus.test.ts
describe('EventBus', () => {
  it('should publish and subscribe to events', async () => {});
  it('should handle request/reply pattern', async () => {});
  it('should timeout on unanswered request', async () => {});
  it('should retry on handler failure', async () => {});
  it('should deduplicate based on eventId (idempotent)', async () => {});
  it('should store failed events in dead letter queue', async () => {});
});
```

### 12.2 Integration Tests

```typescript
// payment-flow.test.ts (integration test with real Redis)
describe('Payment Flow (Event-Driven)', () => {
  it('should process billing.payment.completed and trigger affiliate', async () => {
    // 1. Setup: auth subscribe to payment event
    // 2. Action: billing publish payment.completed
    // 3. Assert: auth menerima event dan kasih komisi
  });

  it('should handle request/reply for limit checks', async () => {
    // 1. Setup: catalog reply handler
    // 2. Action: billing request catalog.countProducts
    // 3. Assert: response sesuai
  });
});
```

### 12.3 E2E Tests

```typescript
// e2e/event-driven.spec.ts (Playwright)
test('complete order flow via events', async () => {
  // 1. Create site → tenant.site.created event
  // 2. Create product → catalog.product.created event
  // 3. Place order → order.placed event
  // 4. Process payment → billing.payment.completed event
  // 5. Verify affiliate commission awarded
});
```

### 12.4 Chaos Testing

```typescript
// Test resilience
describe('Event Bus Resilience', () => {
  it('should recover after Redis disconnection', async () => {});
  it('should not lose events during Redis failover', async () => {});
  it('should handle duplicate events idempotently', async () => {});
  it('should process events in order', async () => {});
});
```

### 12.5 Performance Testing

```bash
# k6 script untuk test event bus throughput
# Target: 1000 events/second dengan latency <10ms (in-process)
# Target: 100 events/second dengan latency <100ms (Redis pub/sub)
```

---

## 13. Rollback Plan

### 13.1 Perubahan yang Aman

Setiap perubahan di phase 1-2 menggunakan **dual-run pattern**:

```
NEW: publish event + process via subscriber
OLD: direct facade call (fallback)
COMPARE: log both results, alert if mismatch

CUTOVER: After X days stable, hapus OLD
ROLLBACK: Enable OLD again, disable NEW
```

### 13.2 Rollback untuk Setiap Phase

| Phase | Rollback Action | Impact |
|-------|----------------|--------|
| Phase 0 | `git revert` event bus infra + `npx prisma migrate down` | High (schema change) |
| Phase 1 | Hapus subscriber, aktifkan facade notifikasi lagi | Low (only notif) |
| Phase 2 | Balikin import facade, nonaktifkan event bus request | Medium (query path) |
| Phase 3 | `git revert` file moves | Medium (file moved) |
| Phase 4 | Balikin dynamic imports | Low |
| Phase 5 | Re-enable facade imports | Low |
| Phase 6 | Re-merge ke monolith | High |

### 13.3 Feature Flag

Gunakan **feature flag** untuk mematikan event-driven per flow:

```typescript
// src/modules/shared/core/feature-flags.ts
export const featureFlags = {
  eventDrivenPayment: process.env.FF_EVENT_DRIVEN_PAYMENT === 'true',
  eventDrivenLimits: process.env.FF_EVENT_DRIVEN_LIMITS === 'true',
  eventDrivenNotifications: process.env.FF_EVENT_DRIVEN_NOTIFICATIONS === 'true',
  // ...
};
```

Dalam kode:

```typescript
if (featureFlags.eventDrivenPayment) {
  await eventBus.publish('billing.payment.completed', payload, 'billing');
} else {
  // Old facade call
  await IdentityClient.awardAffiliateCommission(tx, payload);
}
```

---

## 14. Timeline & Effort

### Estimasi Total: 25-35 hari (5-7 minggu)

| Phase | Timeline | Effort (man-days) | Dependencies |
|-------|----------|-------------------|--------------|
| **Phase 0**: Event Bus Infra | Hari 1-5 | 5 hari | - |
| **Phase 1**: Fire-and-forget | Hari 6-12 | 7 hari | Phase 0 |
| **Phase 2**: Request/Reply | Hari 13-19 | 7 hari | Phase 0 |
| **Phase 3**: Shared Cleanup | Hari 20-23 | 4 hari | Phase 1-2 |
| **Phase 4**: Circular Dep | Hari 24-25 | 2 hari | Phase 2 |
| **Phase 5**: Facade Hapus | Hari 26-29 | 4 hari | Phase 1-4 |
| **Phase 6**: Microservices | Hari 30-35 | 6 hari | Phase 0-5 |

### Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Redis pub/sub reliability | Medium | High | Outbox pattern, retry, DLQ |
| Event ordering | Low | Medium | Correlation ID, sequence number |
| Data consistency (eventual) | Medium | High | Saga pattern, compensating events |
| Performance overhead | Low | Low | In-process event bus option |
| Developer learning curve | High | Medium | Documentation, code review, pair programming |

---

## Appendix A: Daftar File yang Berubah

### New Files (17 files)

```
src/modules/shared/core/event-bus.ts          # EventBus class
src/modules/shared/core/event-types.ts         # Event type definitions
src/modules/shared/core/event-store.ts         # Outbox pattern
src/modules/shared/core/event-errors.ts        # Error types
src/modules/shared/core/__tests__/event-bus.test.ts
src/modules/shared/core/__tests__/event-store.test.ts
src/modules/shared/core/__tests__/event-types.test.ts
src/modules/auth/events/handlers.ts            # Auth event subscribers
src/modules/billing/events/handlers.ts          # Billing event subscribers
src/modules/catalog/events/handlers.ts          # Catalog event subscribers
src/modules/content/events/handlers.ts          # Content event subscribers
src/modules/order/events/handlers.ts            # Order event subscribers
src/modules/tenant/events/handlers.ts           # Tenant event subscribers
tests/integration/event-driven/payment-flow.test.ts
tests/integration/event-driven/limit-check.test.ts
tests/integration/event-driven/order-flow.test.ts
tests/e2e/event-driven.spec.ts
```

### Modified Files (40+ files)

```
prisma/schema.prisma                            # + EventOutbox model
.dependency-cruiser.json                        # + new rules
src/modules/billing/services/limit.service.ts   # eventBus.request instead of facade
src/modules/billing/services/transaction.service.ts  # publish events
src/modules/billing/services/checkout.service.ts
src/modules/billing/services/plan.service.ts
src/modules/billing/services/coupon.service.ts
src/modules/billing/services/followup.service.ts
src/modules/billing/services/webhook.service.ts
src/modules/auth/services/auth.service.ts
src/modules/content/services/post.service.ts
src/modules/content/services/media.service.ts
src/modules/content/services/search.service.ts
src/modules/order/services/order.service.ts
src/modules/tenant/services/domain.service.ts
src/modules/tenant/services/settings.service.ts
src/modules/shared/utils/services/content.service.ts  # MOVED to content/
src/modules/shared/utils/content/menus.ts              # MOVED to content/
src/modules/shared/utils/settings/site.ts              # MOVED to tenant/
src/modules/shared/utils/services/email.ts             # MOVED to tenant/
src/modules/shared/utils/services/backup.service.ts    # MOVED to tenant/
src/modules/shared/utils/api/crud-handler.ts           # use eventBus
... (+ other files with facade imports)
```

### Deleted Files (after migration complete)

```
src/modules/shared/utils/services/content.service.ts   # moved
src/modules/shared/utils/content/menus.ts               # moved
src/modules/shared/utils/settings/site.ts               # moved
src/modules/shared/utils/services/email.ts              # moved
src/modules/shared/utils/services/backup.service.ts     # moved
```

---

## Appendix B: Glossary

| Istilah | Arti |
|---------|------|
| **Event Bus** | Sistem pub/sub untuk komunikasi antar modul |
| **Fire-and-forget** | Event yang tidak butuh response (publish → lupakan) |
| **Request/Reply** | Event yang butuh response (request → tunggu reply) |
| **Outbox Pattern** | Simpan event ke DB dulu sebelum publish ke Redis (jamin reliability) |
| **Dead Letter Queue** | Tempat event gagal setelah retry max |
| **Correlation ID** | ID untuk tracing event chain |
| **Saga Pattern** | Pola untuk menjaga data consistency di distributed system |
| **Compensating Event** | Event untuk membatalkan aksi sebelumnya (rollback) |
| **Idempotent Handler** | Handler yang aman dipanggil berkali-kali |
| **Dual-Run** | Jalanin old + new code secara paralel untuk verifikasi |

---

## Appendix C: Comparsion Facade vs Event-Driven

| Skenario | Facade | Event-Driven | Keterangan |
|----------|--------|-------------|------------|
| **Affiliate commission** | `billing` panggil `auth.awardCommission()` dalam 1 DB transaksi | `billing` publish `affiliate.commission.awarded`, `auth` subscribe dan proses terpisah | Event-driven eventual consistency, tapi lebih scalable |
| **Limit check** | `billing` panggil `catalog.countProducts()` via facade | `billing` request `request.catalog.countProducts` via event bus | Latency tambahan dari Redis, tapi coupling hilang |
| **Payment notification** | `billing` panggil langsung fungsi WA/Email | `billing` publish `billing.payment.completed`, tenant subscribe | Fire-and-forget lebih cepat (ga blocking) |
| **Plan change** | `billing` update quota di semua module via facade | `billing` publish `billing.subscription.changed`, setiap module update quota sendiri | Eventual consistency, but each module owns its data |

---

*Dokumen ini akan diupdate seiring progres migrasi. Setiap phase harus lolos typecheck, dependency-cruiser, dan unit tests.*
