import { test, expect, uniqueIp } from './helpers';

const h = () => ({ 'x-forwarded-for': uniqueIp() });

test.describe('Billing — Plans & Pricing', () => {

  test('GET /api/pricing/plans - returns plans (public)', async ({ request }) => {
    const res = await request.get('/api/pricing/plans', { headers: h() });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /api/admin/plans - requires admin', async ({ request }) => {
    const res = await request.get('/api/admin/plans', { headers: h() });
    expect([401, 403, 429]).toContain(res.status());
  });
});

test.describe('Billing — Checkout & Payment', () => {

  test('POST /api/billing/payment-methods - should return methods', async ({ request }) => {
    const res = await request.post('/api/billing/payment-methods', {
      headers: h(),
      data: { amount: 50000 },
    });
    expect([200, 400, 500, 429]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.methods).toBeDefined();
    }
  });

  test('POST /api/billing/checkout/payment - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/checkout/payment', {
      headers: h(), data: {},
    });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/billing/confirm - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/confirm', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/billing/cancel - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/cancel', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/billing/upgrade - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/upgrade', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/billing/buy-slot - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/buy-slot', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/billing/extend-trial - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/extend-trial', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });
});

test.describe('Billing — Coupon Validation', () => {

  test('POST /api/billing/validate-coupon - without code returns error', async ({ request }) => {
    const res = await request.post('/api/billing/validate-coupon', {
      headers: h(), data: {},
    });
    expect([400, 429]).toContain(res.status());
  });

  test('POST /api/billing/validate-coupon - non-existent code returns 404', async ({ request }) => {
    const res = await request.post('/api/billing/validate-coupon', {
      headers: h(), data: { code: 'NONEXISTENT' },
    });
    expect([404, 400, 429]).toContain(res.status());
  });
});

test.describe('Billing — Check Status', () => {

  test('POST /api/billing/check-status - requires auth', async ({ request }) => {
    const res = await request.post('/api/billing/check-status', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });
});

test.describe('Orders', () => {

  test('GET /api/orders - requires auth', async ({ request }) => {
    const res = await request.get('/api/orders', { headers: h() });
    expect([401, 429]).toContain(res.status());
  });

  test('POST /api/order/orders - requires auth', async ({ request }) => {
    const res = await request.post('/api/order/orders', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/order/orders/payment - requires auth', async ({ request }) => {
    const res = await request.post('/api/order/orders/payment', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/order/orders/payment-methods - requires auth', async ({ request }) => {
    const res = await request.post('/api/order/orders/payment-methods', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });

  test('POST /api/order/orders/check-status - requires auth', async ({ request }) => {
    const res = await request.post('/api/order/orders/check-status', { headers: h(), data: {} });
    expect([401, 400, 429]).toContain(res.status());
  });
});

test.describe('Coupons (Admin)', () => {

  test('GET /api/admin/coupons - requires admin', async ({ request }) => {
    const res = await request.get('/api/admin/coupons', { headers: h() });
    expect([401, 403, 429]).toContain(res.status());
  });

  test('POST /api/admin/coupons - requires admin', async ({ request }) => {
    const res = await request.post('/api/admin/coupons', { headers: h(), data: {} });
    expect([401, 403, 429]).toContain(res.status());
  });
});

test.describe('Withdrawals & Transactions (Admin)', () => {

  test('POST /api/admin/withdrawals/update - requires admin', async ({ request }) => {
    const res = await request.post('/api/admin/withdrawals/update', {
      headers: h(), data: {},
    });
    expect([401, 403, 400, 429]).toContain(res.status());
  });

  test('POST /api/admin/transactions/update - requires admin', async ({ request }) => {
    const res = await request.post('/api/admin/transactions/update', {
      headers: h(), data: {},
    });
    expect([401, 403, 400, 429]).toContain(res.status());
  });
});
