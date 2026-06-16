# Testing Utilities

## Running Tests

```bash
# All tests
bun run test

# Unit tests only
bun run test:unit

# E2E tests only  
bun run test:e2e

# With coverage
bun run test:coverage

# UI mode (interactive)
bun run test:ui
```

## Test Structure

```
tests/
├── unit/           # Unit tests (Vitest)
│   ├── api-utils.test.ts
│   ├── currency.test.ts
│   ├── serialize.test.ts
│   └── subscription-limits.test.ts
│
├── e2e/            # E2E tests (Playwright)
│   ├── api.test.ts
│   └── public.test.ts
│
└── mocks/         # Mock data & factories
    └── index.ts
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('My Module', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/My App/);
});
```

## Mocking

### MSW (Mock Service Worker)

For API mocking in tests:

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/products', () => {
    return HttpResponse.json([
      { id: '1', name: 'Product 1' }
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Coverage Reports

After running tests with coverage:

```bash
# View HTML coverage report
open coverage/index.html
```

## CI Integration

Tests run automatically on GitHub Actions:
- Push to main/develop
- Pull requests
- See `.github/workflows/ci.yml`