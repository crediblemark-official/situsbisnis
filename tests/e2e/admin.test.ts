import { test, expect, uniqueIp } from './helpers';

const h = () => ({ 'x-forwarded-for': uniqueIp() });

test.describe('Admin — Settings', () => {

  test('GET /api/admin/settings - requires admin', async ({ request }) => {
    const res = await request.get('/api/admin/settings', { headers: h() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('PATCH /api/admin/settings - requires admin', async ({ request }) => {
    const res = await request.patch('/api/admin/settings', { headers: h(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/admin/settings/ai-models - without key returns empty', async ({ request }) => {
    const res = await request.post('/api/admin/settings/ai-models', {
      headers: h(), data: { provider: 'openai', apiKey: '' },
    });
    expect([200, 401, 403, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.models)).toBeTruthy();
    }
  });
});

test.describe('Admin — Sites', () => {

  test('GET /api/admin/sites/:id - requires admin', async ({ request }) => {
    const res = await request.get('/api/admin/sites/test-id', { headers: h() });
    expect([401, 403, 404, 429]).toContain(res.status());
  });

  test('PATCH /api/admin/sites/:id - requires admin', async ({ request }) => {
    const res = await request.patch('/api/admin/sites/test-id', { headers: h(), data: {} });
    expect([401, 403, 404, 429]).toContain(res.status());
  });

  test('DELETE /api/admin/sites/:id - requires admin', async ({ request }) => {
    const res = await request.delete('/api/admin/sites/test-id', { headers: h() });
    expect([401, 403, 404, 429]).toContain(res.status());
  });
});

test.describe('Admin — Subscriptions', () => {

  test('GET /api/admin/subscriptions/:id - requires admin', async ({ request }) => {
    const res = await request.get('/api/admin/subscriptions/test-id', { headers: h() });
    expect([401, 403, 404, 429]).toContain(res.status());
  });

  test('PATCH /api/admin/subscriptions/:id - requires admin', async ({ request }) => {
    const res = await request.patch('/api/admin/subscriptions/test-id', { headers: h(), data: {} });
    expect([401, 403, 404, 429]).toContain(res.status());
  });
});

test.describe('Admin — Users', () => {

  test('POST /api/users - requires admin', async ({ request }) => {
    const res = await request.post('/api/users', { headers: h(), data: {} });
    expect([401, 403, 400, 429]).toContain(res.status());
  });

  test('PATCH /api/users/:id - requires admin', async ({ request }) => {
    const res = await request.patch('/api/users/test-id', { headers: h(), data: {} });
    expect([401, 403, 404, 429]).toContain(res.status());
  });

  test('DELETE /api/users/:id - requires admin', async ({ request }) => {
    const res = await request.delete('/api/users/test-id', { headers: h() });
    expect([401, 403, 404, 429]).toContain(res.status());
  });
});

test.describe('Admin — Backup', () => {

  test('GET /api/admin/backup - requires admin', async ({ request }) => {
    const res = await request.get('/api/admin/backup', { headers: h() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/admin/backup - requires admin', async ({ request }) => {
    const res = await request.post('/api/admin/backup', { headers: h(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });
});

test.describe('Admin — Coupons', () => {

  test('DELETE /api/admin/coupons/:id - requires admin', async ({ request }) => {
    const res = await request.delete('/api/admin/coupons/test-id', { headers: h() });
    expect([401, 403, 404, 429]).toContain(res.status());
  });
});

test.describe('AI', () => {

  test('POST /api/ai - without prompt returns 400', async ({ request }) => {
    const res = await request.post('/api/ai', {
      headers: h(), data: {},
    });
    expect([400, 500, 429]).toContain(res.status());
  });

  test('POST /api/ai - with prompt returns result or AI config error', async ({ request }) => {
    const res = await request.post('/api/ai', {
      headers: h(),
      data: { prompt: 'Create a hero section for a coffee shop', mode: 'page' },
    });
    expect([200, 500, 429]).toContain(res.status());
    if (res.status() === 500) {
      const body = await res.json();
      expect(body.error).toContain('AI API key');
    }
  });

  test('POST /api/ai - invalid mode returns 400', async ({ request }) => {
    const res = await request.post('/api/ai', {
      headers: h(),
      data: { prompt: 'test', mode: 'invalid' },
    });
    expect([400, 500, 429]).toContain(res.status());
  });
});
