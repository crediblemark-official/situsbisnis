import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkSiteLimit } from '@/modules/billing/actions';

// Mock dependencies
vi.mock('@/lib/core/db', () => ({
  db: {
    subscription: {
      findFirst: vi.fn(),
    }
  },
}));

vi.mock('@/lib/modules/content/client', () => ({
  ContentClient: {
    countPosts: vi.fn(),
    countTestimonials: vi.fn(),
    getMediaSize: vi.fn(),
  }
}));

vi.mock('@/lib/modules/catalog/client', () => ({
  CatalogClient: {
    countProducts: vi.fn(),
  }
}));

import { db } from '@/lib/core/db';
import { ContentClient } from '@/lib/modules/content/client';
import { CatalogClient } from '@/lib/modules/catalog/client';

describe('lib/subscription-limits.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSiteLimit', () => {
    it('should return not allowed when no subscription', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
      
      const result = await checkSiteLimit('site-1', 'maxPosts');
      
      expect(result).toEqual({ allowed: false, message: expect.stringContaining('subscription') });
    });

    it('should return allowed when plan has -1 (unlimited)', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Pro', maxPosts: -1, features: { hasBlog: true } }
      } as any);
      
      const result = await checkSiteLimit('site-1', 'maxPosts');
      
      expect(result).toEqual({ allowed: true });
    });

    it('should return allowed when under limit', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Basic', maxPosts: 10, features: { hasBlog: true } }
      } as any);
      
      vi.mocked(ContentClient.countPosts).mockResolvedValue(5);
      
      const result = await checkSiteLimit('site-1', 'maxPosts');
      
      expect(result).toEqual({ allowed: true });
    });

    it('should return not allowed when at limit', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Basic', maxPosts: 10, features: { hasBlog: true } }
      } as any);
      
      vi.mocked(ContentClient.countPosts).mockResolvedValue(10);
      
      const result = await checkSiteLimit('site-1', 'maxPosts');
      
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('10');
      expect(result.message).toContain('posts');
    });

    it('should handle different limit types', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Basic', maxProducts: 5, features: { hasProducts: true } }
      } as any);
      
      vi.mocked(CatalogClient.countProducts).mockResolvedValue(6);
      
      const result = await checkSiteLimit('site-1', 'maxProducts');
      
      expect(result.allowed).toBe(false);
    });
  });
});