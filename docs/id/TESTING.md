# Panduan Testing - SitusBisnis

## Ikhtisar

Proyek ini menggunakan dua jenis testing:

- **Unit Tests** (Vitest) - untuk logic/library
- **E2E Tests** (Playwright) - untuk integrasi

---

## Memulai Cepat

```bash
# Install semua dependencies (sudah termasuk testing libs)
bun install

# Jalur cepat - menjalankan semua
bun test
```

---

## Unit Testing

### Menjalankan Unit Tests

```bash
# Semua unit tests
bun run test:unit

# Dengan coverage report
bun run test:coverage

# Interactive UI mode
bun run test:ui

# File tunggal
npx vitest run tests/unit/currency.test.ts
```

### Menulis Unit Test

```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from "vitest";

describe("Nama Modul", () => {
  it("harus melakukan sesuatu", () => {
    expect(true).toBe(true);
  });
});
```

### Mocking Dependencies

```typescript
// Mock modul eksternal
vi.mock("../db", () => ({
  db: {
    product: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Mock functions
vi.mocked(myFunction).mockReturnValue(value);
```

### Lokasi Unit Tests

```
tests/unit/
├── api-utils.test.ts         # Testing API helpers
├── currency.test.ts          # Format mata uang
├── serialize.test.ts         # Serialisasi Prisma
└── subscription-limits.test.ts # Batasan paket
```

---

## E2E Testing

### Menjalankan E2E Tests

```bash
# Semua E2E tests
bun run test:e2e

# Browser spesifik
npx playwright test --project=chromium

# Dengan UI
npx playwright test --ui

# File spesifik
npx playwright test tests/e2e/api.test.ts
```

### Struktur E2E Test

```typescript
// tests/e2e/example.test.ts
import { test, expect } from "@playwright/test";

test("deskripsi", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/1001-Web/);
});
```

### Lokasi E2E Tests

```
tests/e2e/
├── public.test.ts    # Halaman publik (homepage, navigasi)
├── api.test.ts       # Endpoint API (validasi, auth)
└── ...
```

### Setup Browser (Pertama Kali)

```bash
# Install browser
npx playwright install

# Install browser spesifik
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

---

## Pipeline CI/CD

### GitHub Actions

Test otomatis berjalan pada:

| Trigger           | Jobs                                 |
| ----------------- | ------------------------------------ |
| Push ke `main`    | Lint → Unit → E2E → Build → Deploy   |
| Push ke `develop` | Lint → Unit → Build → Deploy Staging |
| Pull Request      | Lint → Unit → Build                  |

### Pipeline Manual

```bash
# Langkah 1: Lint
bun run lint

# Langkah 2: TypeScript
bun run typecheck

# Langkah 3: Unit Tests
bun run test:unit

# Langkah 4: E2E Tests
bun run test:e2e

# Langkah 5: Build
bun run build
```

---

## Environment Variables

### Lingkungan Testing

```env
# .env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/test"
NEXTAUTH_SECRET="test-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Pemecahan Masalah

### Masalah Umum

#### 1. Database Connection Error

```bash
# Ganti DATABASE_URL di .env.test
# Atau skip tests yang butuh DB
bun run test:unit -- --grep "without-db"
```

#### 2. Port Already in Use

```bash
# Kill proses di port 3000
lsof -ti:3000 | xargs kill -9

# Atau gunakan port berbeda
PORT=3001 bun test:e2e
```

#### 3. Playwright Browser Not Found

```bash
# Install ulang browser
npx playwright install --with-deps
```

---

## Praktik Terbaik

### Unit Tests

- ✅ Test pure functions
- ✅ Mock dependensi eksternal (DB, API)
- ✅ Ikuti pola AAA (Arrange, Act, Assert)
- ✅ Gunakan nama test deskriptif

### E2E Tests

- ✅ Test alur kritis pengguna
- ✅ Gunakan selector data-testid
- ✅ Bersihkan data test setelah test
- ✅ Jangan test detail implementasi

---

## Laporan Coverage

### Melihat Coverage

```bash
# Generate coverage
bun run test:coverage

# Buka laporan HTML
open coverage/index.html
```

### Target Coverage

```
Unit Tests:  > 70%
E2E Tests:   Hanya jalur kritis
```

---

## Referensi

| Resource        | Link                    |
| --------------- | ----------------------- |
| Vitest Docs     | https://vitest.dev/     |
| Playwright Docs | https://playwright.dev/ |
| MSW (Mocking)   | https://mswjs.io/       |

---

## Ringkasan Perintah

```bash
# Development
bun dev                  # Memulai server dev
bun run build           # Build production

# Testing
bun test                # Semua test
bun run test:unit       # Hanya unit tests
bun run test:e2e        # Hanya E2E tests
bun run test:coverage   # Dengan coverage
bun run test:ui         # Mode interaktif

# Quality
bun run lint            # ESLint
bun run typecheck       # TypeScript
```

---

_Terakhir Diperbarui: Mei 2026_
