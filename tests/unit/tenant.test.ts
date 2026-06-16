import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTenant } from '@/lib/domains/tenant';
import { headers } from 'next/headers';
import { getRootDomain } from '@/lib/domains/utils';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/lib/domains/utils', () => ({
  getRootDomain: vi.fn(),
}));

vi.mock('@/lib/core/db', () => ({
  db: {
    site: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
    },
  },
}));

describe('lib/tenant.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof vi.stubEnv === 'function') {
      vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'example.com');
    } else {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'example.com';
    }
  });

  afterEach(() => {
    if (typeof vi.unstubAllEnvs === 'function') {
      vi.unstubAllEnvs();
    }
  });

  describe('getTenant', () => {
    it('should return subdomain from x-tenant-subdomain header if present', async () => {
      (headers as any).mockResolvedValue({
        get: vi.fn((key) => (key === 'x-tenant-subdomain' ? 'my-tenant' : null)),
      });

      const tenant = await getTenant();
      expect(tenant).toBe('my-tenant');
    });

    it('should return subdomain from host header', async () => {
      (headers as any).mockResolvedValue({
        get: vi.fn((key) => (key === 'host' ? 'tenant.example.com' : null)),
      });
      (getRootDomain as any).mockReturnValue('example.com');

      const tenant = await getTenant();
      expect(tenant).toBe('tenant');
    });

    it('should return null if exactly on root domain', async () => {
      (headers as any).mockResolvedValue({
        get: vi.fn((key) => (key === 'host' ? 'example.com' : null)),
      });
      (getRootDomain as any).mockReturnValue('example.com');

      const tenant = await getTenant();
      expect(tenant).toBeNull();
    });

    it('should return null if on www root domain', async () => {
      (headers as any).mockResolvedValue({
        get: vi.fn((key) => (key === 'host' ? 'www.example.com' : null)),
      });
      (getRootDomain as any).mockReturnValue('example.com');

      const tenant = await getTenant();
      expect(tenant).toBeNull();
    });

    it('should return host if it is a custom domain (not ending in root domain)', async () => {
      (headers as any).mockResolvedValue({
        get: vi.fn((key) => (key === 'host' ? 'my-custom-domain.io' : null)),
      });
      (getRootDomain as any).mockReturnValue('example.com');

      const tenant = await getTenant();
      expect(tenant).toBe('my-custom-domain.io');
    });

    it('should handle localhost with subdomain', async () => {
        (headers as any).mockResolvedValue({
          get: vi.fn((key) => (key === 'host' ? 'tenant.localhost:3000' : null)),
        });
        (getRootDomain as any).mockReturnValue('localhost:3000');
  
        const tenant = await getTenant();
        expect(tenant).toBe('tenant');
      });
  });

  describe('getSiteAccessStatus', () => {
    it('should be testable', () => {
        expect(true).toBe(true);
    });
  });
});
