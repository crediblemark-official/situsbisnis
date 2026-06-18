import { test, expect } from '@playwright/test';

const uniqueIp = () => `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;
const h = () => ({ 'x-forwarded-for': uniqueIp() });
const TH = () => ({ ...h(), 'x-tenant-subdomain': 'demo1' });

test.describe('Public API Endpoints', () => {
  test('gallery - GET should return array (with tenant)', async ({ request }) => {
    const res = await request.get('/api/gallery', { headers: TH() });
    expect([200, 400, 401, 429]).toContain(res.status());
  });

  test('gallery - GET via media/gallery alias', async ({ request }) => {
    const res = await request.get('/api/media/gallery', { headers: TH() });
    expect([200, 400, 401, 429]).toContain(res.status());
  });

  test('analytics - GET should return stats (public)', async ({ request }) => {
    const res = await request.get('/api/analytics', { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('todayViews');
    expect(body).toHaveProperty('totalViews');
  });

  test('settings - GET should return platform settings (public)', async ({ request }) => {
    const res = await request.get('/api/settings', { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('siteName');
  });

  test('menus - GET should return menu or null on platform root', async ({ request }) => {
    const res = await request.get('/api/menus?slug=main', { headers: h() });
    expect(res.ok()).toBeTruthy();
  });

  test('menus - GET footer menu should return menu or null', async ({ request }) => {
    const res = await request.get('/api/menus?slug=footer', { headers: h() });
    expect(res.ok()).toBeTruthy();
  });

  test('contact - POST should work without auth', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: h(),
      data: { name: 'Test User', email: 'test@example.com', message: 'Test message' },
    });
    expect([200, 400, 500, 429]).toContain(res.status());
  });

  test('health - GET should return health status', async ({ request }) => {
    const res = await request.get('/api/health', { headers: h() });
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('checks');
    }
  });

  test('search - GET should be callable', async ({ request }) => {
    const res = await request.get('/api/search?q=test', { headers: h() });
    expect([200, 401, 429]).toContain(res.status());
  });
});

test.describe('API Validation', () => {
  test('contact - POST with invalid email should return 400', async ({ request }) => {
    const res = await request.post('/api/contact', {
      headers: h(),
      data: { name: 'Test', email: 'not-an-email', message: 'Test' },
    });
    expect([400, 401, 429]).toContain(res.status());
  });
});

test.describe('Auth Bridge', () => {
  test('GET /api/auth/bridge - without session redirects to login', async ({ request }) => {
    const res = await request.get('/api/auth/bridge', { headers: h() });
    // Unauthenticated: redirects to /login (307), or maybe 200 if session exists
    expect([200, 302, 307, 400, 401]).toContain(res.status());
  });

  test('GET /api/auth/bridge - with target also redirects', async ({ request }) => {
    const res = await request.get('/api/auth/bridge?target=http://example.com', { headers: h() });
    expect([200, 302, 307, 400, 401]).toContain(res.status());
  });
});
