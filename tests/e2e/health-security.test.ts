import { test, expect } from '@playwright/test';

test.describe('Health Check API', () => {
  test('should return healthy status', async ({ request }) => {
    const uniqueIp = `1.2.9.${Math.floor(Math.random() * 200) + 10}`;
    const response = await request.get('/api/health', { headers: { 'x-forwarded-for': uniqueIp } });
    expect([200, 503]).toContain(response.status());
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('database');
    expect(body.checks).toHaveProperty('storage');
  });

  test('should return valid timestamp format', async ({ request }) => {
    const uniqueIp = `1.2.9.${Math.floor(Math.random() * 200) + 10}`;
    const response = await request.get('/api/health', { headers: { 'x-forwarded-for': uniqueIp } });
    const body = await response.json();
    expect(new Date(body.timestamp).toISOString()).toBeTruthy();
  });
});

test.describe('Rate Limiting', () => {
  test('should include rate limit headers on API routes', async ({ request }) => {
    const uniqueIp = `1.2.3.${Math.floor(Math.random() * 200) + 10}`;
    const response = await request.get('/api/posts', { headers: { 'x-forwarded-for': uniqueIp } });
    expect(response.headers()['x-ratelimit-limit']).toBeDefined();
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
  });

  test('should return 429 after exceeding limit', async ({ request }) => {
    const uniqueIp = `1.2.4.${Math.floor(Math.random() * 200) + 10}`;
    const requests = [];
    for (let i = 0; i < 105; i++) {
      requests.push(request.get('/api/posts', { headers: { 'x-forwarded-for': uniqueIp } }));
    }
    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status());
    expect(statusCodes).toContain(429);
  });

  test('should include Retry-After header on 429', async ({ request }) => {
    const uniqueIp = `1.2.5.${Math.floor(Math.random() * 200) + 10}`;
    for (let i = 0; i < 105; i++) {
      await request.get('/api/posts', { headers: { 'x-forwarded-for': uniqueIp } });
    }
    const response = await request.get('/api/posts', { headers: { 'x-forwarded-for': uniqueIp } });
    if (response.status() === 429) {
      expect(response.headers()['retry-after']).toBeDefined();
    }
  });
});

test.describe('Security Headers', () => {
  test('should include X-Content-Type-Options', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('should include X-Frame-Options', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
  });
});
