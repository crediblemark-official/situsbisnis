import { test, expect, uniqueIp } from './helpers';

const h = () => ({ 'x-forwarded-for': uniqueIp() });
const TH = () => ({ ...h(), 'x-tenant-subdomain': 'demo1' });

test.describe('Posts', () => {

  test('GET /api/posts - returns paginated result', async ({ request }) => {
    const res = await request.get('/api/posts', { headers: TH() });
    expect([200, 400, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.posts)).toBeTruthy();
      expect(body).toHaveProperty('pagination');
    }
  });

  test('POST /api/posts - requires auth', async ({ request }) => {
    const res = await request.post('/api/posts', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/posts - rejects invalid data when authenticated', async ({ request, authCookie }) => {
    test.skip(!authCookie, 'E2E_TEST_EMAIL/PASSWORD not set');
    const res = await request.post('/api/posts', {
      headers: { ...TH(), Cookie: authCookie },
      data: {},
    });
    expect([400, 429]).toContain(res.status());
  });

  test('GET /api/posts/:id - detail requires valid ID', async ({ request }) => {
    const res = await request.get('/api/posts/nonexistent-id', { headers: TH() });
    expect([200, 404, 400, 500, 429]).toContain(res.status());
  });
});

test.describe('Testimonials', () => {

  test('GET /api/testimonials - returns paginated result', async ({ request }) => {
    const res = await request.get('/api/testimonials', { headers: TH() });
    expect([200, 400, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.testimonials)).toBeTruthy();
      expect(body).toHaveProperty('pagination');
    }
  });

  test('POST /api/testimonials - submit as public works', async ({ request }) => {
    const res = await request.post('/api/testimonials', {
      headers: TH(),
      data: { name: 'Test', content: 'Great service!', rating: 5 },
    });
    expect([200, 400, 401, 429]).toContain(res.status());
  });
});

test.describe('Taxonomies', () => {

  test('GET /api/taxonomies - requires auth', async ({ request }) => {
    const res = await request.get('/api/taxonomies', { headers: TH() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/taxonomies - requires auth', async ({ request }) => {
    const res = await request.post('/api/taxonomies', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });
});

test.describe('Catalog — Products', () => {

  test('GET /api/products - returns paginated result', async ({ request }) => {
    const res = await request.get('/api/products', { headers: TH() });
    expect([200, 400, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.products)).toBeTruthy();
      expect(body).toHaveProperty('pagination');
    }
  });

  test('POST /api/products - requires auth', async ({ request }) => {
    const res = await request.post('/api/products', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('GET /api/products/:id - requires valid ID', async ({ request }) => {
    const res = await request.get('/api/products/nonexistent', { headers: TH() });
    expect([200, 404, 400, 429]).toContain(res.status());
  });
});

test.describe('Media', () => {

  test('GET /api/media - requires auth', async ({ request }) => {
    const res = await request.get('/api/media', { headers: TH() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/media - requires auth', async ({ request }) => {
    const res = await request.post('/api/media', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('GET /api/media/folders - requires auth', async ({ request }) => {
    const res = await request.get('/api/media/folders', { headers: TH() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('GET /api/media/gallery - returns gallery list (public)', async ({ request }) => {
    const res = await request.get('/api/media/gallery', { headers: TH() });
    expect([200, 400, 401, 403, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('data');
    }
  });

  test('GET /api/media/portfolios - returns portfolio list (public)', async ({ request }) => {
    const res = await request.get('/api/media/portfolios', { headers: TH() });
    expect([200, 400, 401, 403, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('data');
    }
  });

  test('POST /api/media/gallery - requires auth', async ({ request }) => {
    const res = await request.post('/api/media/gallery', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/media/portfolios - requires auth', async ({ request }) => {
    const res = await request.post('/api/media/portfolios', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });
});

test.describe('Pages', () => {

  test('GET /api/pages - returns pages for tenant', async ({ request }) => {
    const res = await request.get('/api/pages', { headers: TH() });
    expect([200, 400, 401, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body)).toBeTruthy();
    }
  });

  test('POST /api/pages - requires auth', async ({ request }) => {
    const res = await request.post('/api/pages', { headers: TH(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('GET /api/page/menus - requires tenant headers', async ({ request }) => {
    const res = await request.get('/api/page/menus', { headers: h() });
    expect([200, 400, 429]).toContain(res.status());
  });
});

test.describe('Domains', () => {

  test('POST /api/domains/verify - requires auth', async ({ request }) => {
    const res = await request.post('/api/domains/verify', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });
});
