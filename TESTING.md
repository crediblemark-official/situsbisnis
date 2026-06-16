# Testing Guide - SitusBisnis

## Overview

Project ini menggunakan dua jenis testing:

- **Unit Tests** (Vitest) - untuk logic/library
- **E2E Tests** (Playwright) - untuk integrasi

---

## Quick Start

```bash
# Install semua dependencies (sudah termasuk testing libs)
bun install

# Jalur cepat - running semua
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

# Single file
npx vitest run tests/unit/currency.test.ts
```

### Menulis Unit Test

```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from "vitest";

describe("Module Name", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });
});
```

### Mocking Dependencies

```typescript
// Mock external modules
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
├── currency.test.ts          # Currency formatting
├── serialize.test.ts         # Prisma serialization
└── subscription-limits.test.ts # Plan limits
```

---

## E2E Testing

### Menjalankan E2E Tests

```bash
# Semua E2E tests
bun run test:e2e

# Specific browser
npx playwright test --project=chromium

# Dengan UI
npx playwright test --ui

# Specific file
npx playwright test tests/e2e/api.test.ts
```

### E2E Test Structure

```typescript
// tests/e2e/example.test.ts
import { test, expect } from "@playwright/test";

test("description", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/1001-Web/);
});
```

### Lokasi E2E Tests

```
tests/e2e/
├── public.test.ts    # Public pages (homepage, navigation)
├── api.test.ts       # API endpoints (validation, auth)
└── ...
```

### Setup Browser (First Time)

```bash
# Install browsers
npx playwright install

# Install specific browsers
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

---

## CI/CD Pipeline

### GitHub Actions

Tests otomatis berjalan pada:

| Trigger           | Jobs                                 |
| ----------------- | ------------------------------------ |
| Push ke `main`    | Lint → Unit → E2E → Build → Deploy   |
| Push ke `develop` | Lint → Unit → Build → Deploy Staging |
| Pull Request      | Lint → Unit → Build                  |

### Manual Pipeline

```bash
# Step 1: Lint
bun run lint

# Step 2: TypeScript
bun run typecheck

# Step 3: Unit Tests
bun run test:unit

# Step 4: E2E Tests
bun run test:e2e

# Step 5: Build
bun run build
```

---

## Environment Variables

### Testing Environment

```env
# .env.test
DATABASE_URL="postgresql://user:pass@localhost:5432/test"
NEXTAUTH_SECRET="test-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Ganti DATABASE_URL di .env.test
# Atau skip tests yang butuh DB
bun run test:unit -- --grep "without-db"
```

#### 2. Port Already in Use

```bash
# Kill process di port 3000
lsof -ti:3000 | xargs kill -9

# Atau use different port
PORT=3001 bun test:e2e
```

#### 3. Playwright Browser Not Found

```bash
# Reinstall browsers
npx playwright install --with-deps
```

---

## Best Practices

### Unit Tests

- ✅ Test pure functions
- ✅ Mock external dependencies (DB, API)
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Use descriptive test names

### E2E Tests

- ✅ Test critical user flows
- ✅ Use data-testid selectors
- ✅ Clean up test data after tests
- ✅ Don't test implementation details

---

## Coverage Reports

### View Coverage

```bash
# Generate coverage
bun run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Target

```
Unit Tests:  > 70%
E2E Tests:   Critical paths only
```

---

## References

| Resource        | Link                    |
| --------------- | ----------------------- |
| Vitest Docs     | https://vitest.dev/     |
| Playwright Docs | https://playwright.dev/ |
| MSW (Mocking)   | https://mswjs.io/       |

---

## Commands Summary

```bash
# Development
bun dev                  # Start dev server
bun run build           # Build production

# Testing
bun test                # All tests
bun run test:unit       # Unit tests only
bun run test:e2e        # E2E tests only
bun run test:coverage   # With coverage
bun run test:ui         # Interactive mode

# Quality
bun run lint            # ESLint
bun run typecheck       # TypeScript
```

---

_Last Updated: May 2026_
