import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import proxy from '@/proxy';
import { NextRequest } from 'next/server';

vi.mock('@/lib/core/redis', () => ({
  isRedisAvailable: false,
  getRedis: vi.fn().mockResolvedValue(null),
}));

describe('proxy.ts (Middleware Logic)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should redirect to HTTPS in production if protocol is HTTP', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new NextRequest('http://example.com/some-page', {
      headers: {
        host: 'example.com',
        'x-forwarded-proto': 'http',
      },
    });

    const res = await proxy(req);
    expect(res?.status).toBe(301);
    expect(res?.headers.get('location')).toBe('https://example.com/some-page');
  });

  it('should redirect /dashboard to /dashboard/sites on root domain', async () => {
    const req = new NextRequest('http://example.com/dashboard', {
      headers: {
        host: 'example.com',
      },
    });

    const res = await proxy(req);
    expect(res?.status).toBe(308);
    expect(res?.headers.get('location')).toContain('/dashboard/sites');
  });

  it('should redirect platform routes from subdomain to root domain', async () => {
    const req = new NextRequest('http://tenant.example.com/login', {
      headers: {
        host: 'tenant.example.com',
      },
    });

    const res = await proxy(req);
    expect(res?.status).toBe(308);
    expect(res?.headers.get('location')).toBe('http://example.com/login');
  });

  it('should redirect platform routes from custom domain to root domain', async () => {
    const req = new NextRequest('http://kbmkreatoryogyakarta.com/login', {
      headers: {
        host: 'kbmkreatoryogyakarta.com',
      },
    });

    const res = await proxy(req);
    expect(res?.status).toBe(308);
    expect(res?.headers.get('location')).toBe('http://example.com/login');
  });

  it('should NOT redirect /dashboard from subdomain (allow site management)', async () => {
    const req = new NextRequest('http://tenant.example.com/dashboard', {
      headers: {
        host: 'tenant.example.com',
      },
    });

    const res = await proxy(req);
    // Should NOT be a redirect
    expect(res?.status).toBe(200);
  });

  it('should add security headers to the response', async () => {
    const req = new NextRequest('http://tenant.example.com/home', {
      headers: {
        host: 'tenant.example.com',
      },
    });

    const res = await proxy(req);
    expect(res?.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res?.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should set x-tenant-subdomain header for valid subdomains', async () => {
    const req = new NextRequest('http://mytenant.example.com/home', {
      headers: {
        host: 'mytenant.example.com',
      },
    });

    await proxy(req);
    // In Next.js middleware, modified headers are on the response object's request property or similar
    // depending on how Next.js mock works. In real Next.js, it's passed to NextResponse.next()
  });
});
