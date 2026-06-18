import { test, expect, uniqueIp } from './helpers';

const h = () => ({ 'x-forwarded-for': uniqueIp() });
const TH = () => ({ ...h(), 'x-tenant-subdomain': 'demo1' });

test.describe('Auth — Register & Login', () => {

  test('POST /api/auth/register - rejects missing fields', async ({ request }) => {
    const res = await request.post('/api/auth/register', { headers: h(), data: {} });
    expect(res.status()).toBe(400);
  });

  test('GET /api/auth/session - returns 200 when unauthenticated', async ({ request }) => {
    const res = await request.get('/api/auth/session', { headers: h() });
    expect(res.ok()).toBeTruthy();
  });
});

test.describe('Auth — Users', () => {

  test('GET /api/users - requires admin', async ({ request }) => {
    const res = await request.get('/api/users', { headers: h() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('GET /api/users - returns list when authenticated as admin', async ({ request, authCookie }) => {
    test.skip(!authCookie, 'E2E_TEST_EMAIL/PASSWORD not set');
    const res = await request.get('/api/users', { headers: { ...h(), Cookie: authCookie } });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.users)).toBeTruthy();
    }
  });
});

test.describe('Auth — Profile', () => {

  test('PUT /api/profile - requires auth', async ({ request }) => {
    const res = await request.put('/api/profile', { headers: h(), data: { name: 'Test' } });
    expect([401, 429]).toContain(res.status());
  });

  test('PUT /api/profile - updates profile when authenticated', async ({ request, authCookie }) => {
    test.skip(!authCookie, 'E2E_TEST_EMAIL/PASSWORD not set');
    const res = await request.put('/api/profile', {
      headers: { ...h(), Cookie: authCookie },
      data: { name: 'E2E Test User' },
    });
    expect([200, 429]).toContain(res.status());
  });
});

test.describe('Auth — User Sites', () => {

  test('GET /api/user/sites - requires auth', async ({ request }) => {
    const res = await request.get('/api/user/sites', { headers: h() });
    expect([401, 429]).toContain(res.status());
  });

  test('GET /api/user/sites - returns sites when authenticated', async ({ request, authCookie }) => {
    test.skip(!authCookie, 'E2E_TEST_EMAIL/PASSWORD not set');
    const res = await request.get('/api/user/sites', { headers: { ...h(), Cookie: authCookie } });
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.sites)).toBeTruthy();
    }
  });

  test('PATCH /api/user/sites - requires auth', async ({ request }) => {
    const res = await request.patch('/api/user/sites', { headers: h(), data: {} });
    expect([401, 429]).toContain(res.status());
  });

  test('POST /api/user/sites/verify - requires auth', async ({ request }) => {
    const res = await request.post('/api/user/sites/verify', { headers: h(), data: {} });
    expect([401, 429]).toContain(res.status());
  });
});

test.describe('Auth — Affiliate', () => {

  test('GET /api/affiliate/check - without code returns 400', async ({ request }) => {
    const res = await request.get('/api/affiliate/check', { headers: h() });
    expect(res.status()).toBe(400);
  });

  test('GET /api/affiliate/check - with non-existent code returns false', async ({ request }) => {
    const res = await request.get('/api/affiliate/check?code=NONEXISTENT', { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.exists).toBe(false);
  });

  test('POST /api/affiliate/withdraw - requires auth', async ({ request }) => {
    const res = await request.post('/api/affiliate/withdraw', { headers: h(), data: {} });
    expect([401, 429]).toContain(res.status());
  });

  test('POST /api/affiliate/withdraw - rejects invalid data', async ({ request, authCookie }) => {
    test.skip(!authCookie, 'E2E_TEST_EMAIL/PASSWORD not set');
    const res = await request.post('/api/affiliate/withdraw', {
      headers: { ...h(), Cookie: authCookie },
      data: { amount: 1000 },
    });
    expect([400, 429]).toContain(res.status());
  });
});

test.describe('Auth — Bridge', () => {

  test('GET /api/auth/bridge - without session redirects to login', async ({ request }) => {
    const res = await request.get('/api/auth/bridge', { headers: h() });
    // Playwright follows redirect: login page is 200
    expect([200, 302, 307]).toContain(res.status());
  });

  test('GET /api/auth/bridge - with target also redirects when no session', async ({ request }) => {
    const res = await request.get('/api/auth/bridge?target=http://example.com', { headers: h() });
    expect([200, 302, 307, 400]).toContain(res.status());
  });

  test('GET /api/auth/bridge/accept - without token redirects to login', async ({ request }) => {
    const res = await request.get('/api/auth/bridge/accept', { headers: h() });
    expect([200, 302, 307]).toContain(res.status());
  });
});
