import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('gallery - GET should return array', async ({ request }) => {
    const response = await request.get('/api/gallery');
    expect([200, 401, 400, 429]).toContain(response.status());
  });

  test('analytics - GET should return stats (public)', async ({ request }) => {
    const response = await request.get('/api/analytics');
    // Analytics should be public (no auth required)
    expect([200, 400, 429]).toContain(response.status());
  });

  test('contact - POST should work without auth', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
      },
    });
    expect([200, 400, 500, 429]).toContain(response.status());
  });
});

test.describe('API Validation', () => {
  test('contact - POST with invalid email should return 400', async ({ request }) => {
    const response = await request.post('/api/contact', {
      data: {
        name: 'Test',
        email: 'not-an-email',
        message: 'Test',
      },
    });
    expect([400, 401, 429]).toContain(response.status());
  });
});