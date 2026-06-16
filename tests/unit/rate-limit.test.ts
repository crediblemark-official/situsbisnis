import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimitMiddleware } from '@/lib/core/rate-limit';
import { NextRequest } from 'next/server';

vi.mock('@/lib/core/redis', () => ({
  isRedisAvailable: false,
  getRedis: vi.fn().mockResolvedValue(null),
}));

function createMockRequest(url: string, ip?: string) {
  const headers = new Headers();
  if (ip) headers.set('x-forwarded-for', ip);
  return {
    nextUrl: new URL(url, 'http://localhost:3000'),
    headers,
  } as NextRequest;
}

describe('lib/core/rate-limit.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rateLimitMiddleware', () => {
    it('should allow requests under limit', async () => {
      const req = createMockRequest('/api/test', '127.0.0.1');
      const result = await rateLimitMiddleware(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(200);
    });

    it('should return null for non-API routes', async () => {
      const req = createMockRequest('/dashboard', '127.0.0.1');
      const result = await rateLimitMiddleware(req);
      expect(result).toBeNull();
    });

    it('should include rate limit headers', async () => {
      const req = createMockRequest('/api/test', '127.0.0.2');
      const result = await rateLimitMiddleware(req);
      expect(result).not.toBeNull();
      expect(result?.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(result?.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(result?.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should block requests exceeding limit', async () => {
      const ip = '10.0.0.1';
      for (let i = 0; i < 101; i++) {
        const req = createMockRequest('/api/test', ip);
        await rateLimitMiddleware(req);
      }

      const req = createMockRequest('/api/test', ip);
      const result = await rateLimitMiddleware(req);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });

    it('should have stricter limit for auth endpoints', async () => {
      const ip = '10.0.0.2';
      for (let i = 0; i < 21; i++) {
        const req = createMockRequest('/api/auth/login', ip);
        await rateLimitMiddleware(req);
      }

      const req = createMockRequest('/api/auth/login', ip);
      const result = await rateLimitMiddleware(req);
      expect(result?.status).toBe(429);
    });

    it('should return 429 with Retry-After header', async () => {
      const ip = '10.0.0.3';
      for (let i = 0; i < 101; i++) {
        const req = createMockRequest('/api/test', ip);
        await rateLimitMiddleware(req);
      }

      const req = createMockRequest('/api/test', ip);
      const result = await rateLimitMiddleware(req);
      expect(result?.headers.get('Retry-After')).toBeDefined();
    });
  });
});
