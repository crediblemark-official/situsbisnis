import { describe, it, expect } from 'vitest';
import { getRootDomain, getProtocol, getBaseUrl, isApexDomain } from '@/lib/domains/utils';

describe('lib/domains/utils.ts', () => {
  describe('getRootDomain', () => {
    it('should return env variable when set', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'example.com';
      expect(getRootDomain()).toBe('example.com');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });

    it('should strip protocol from env variable', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = 'https://example.com';
      expect(getRootDomain()).toBe('example.com');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });

    it('should fallback to localhost:3000 when no host', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      expect(getRootDomain()).toBe('localhost:3000');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });

    it('should return localhost:3000 for localhost hosts', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      expect(getRootDomain('localhost:3000')).toBe('localhost:3000');
      expect(getRootDomain('tenant.localhost:3000')).toBe('localhost:3000');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });

    it('should extract root domain from subdomain', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      expect(getRootDomain('app.example.com')).toBe('example.com');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });

    it('should handle 2-part domains', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      expect(getRootDomain('example.com')).toBe('example.com');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });

    it('should handle multi-part TLDs when env is empty', () => {
      const original = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_ROOT_DOMAIN;
      expect(getRootDomain('toko.co.id')).toBe('toko.co.id');
      expect(getRootDomain('store.toko.co.id')).toBe('toko.co.id');
      expect(getRootDomain('example.com.co')).toBe('example.com.co');
      expect(getRootDomain('sub.example.com.co')).toBe('example.com.co');
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = original;
    });
  });

  describe('getProtocol', () => {
    it('should return http for localhost', () => {
      expect(getProtocol('localhost:3000')).toBe('http');
    });

    it('should return http in development', () => {
      const original = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
      expect(getProtocol()).toBe('http');
      (process.env as any).NODE_ENV = original;
    });

    it('should return https for production', () => {
      const original = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      expect(getProtocol('example.com')).toBe('https');
      (process.env as any).NODE_ENV = original;
    });
  });

  describe('getBaseUrl', () => {
    it('should use NEXT_PUBLIC_APP_URL when no host', () => {
      const original = process.env.NEXT_PUBLIC_APP_URL;
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      expect(getBaseUrl()).toBe('https://app.example.com');
      process.env.NEXT_PUBLIC_APP_URL = original;
    });

    it('should construct URL from host', () => {
      expect(getBaseUrl('example.com')).toBe('https://example.com');
    });

    it('should fallback to localhost when no env or host', () => {
      const original = process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getBaseUrl()).toBe('http://localhost:3000');
      process.env.NEXT_PUBLIC_APP_URL = original;
    });
  });

  describe('isApexDomain', () => {
    it('should return true for 2-part apex domains', () => {
      expect(isApexDomain('example.com')).toBe(true);
      expect(isApexDomain('my-store.net')).toBe(true);
    });

    it('should return false for 3-part subdomain domains with standard TLDs', () => {
      expect(isApexDomain('sub.example.com')).toBe(false);
      expect(isApexDomain('www.my-store.net')).toBe(false);
    });

    it('should return true for 3-part apex domains with multi-part TLDs', () => {
      expect(isApexDomain('toko.co.id')).toBe(true);
      expect(isApexDomain('shop.com.co')).toBe(true);
      expect(isApexDomain('school.sch.id')).toBe(true);
    });

    it('should return false for 4-part subdomains with multi-part TLDs', () => {
      expect(isApexDomain('sub.toko.co.id')).toBe(false);
      expect(isApexDomain('www.shop.com.co')).toBe(false);
    });

    it('should return false for empty/invalid domains', () => {
      expect(isApexDomain('')).toBe(false);
    });
  });
});
