import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubscriptionClient } from '@/modules/subscription';

// Mock dependencies
vi.mock('@/lib/core/db', () => ({
  db: {
    subscription: {
      findFirst: vi.fn(),
    }
  },
}));

vi.mock('@/modules/post', () => ({
  PostClient: {
    countPosts: vi.fn(),
    countTestimonials: vi.fn(),
  }
}));

vi.mock('@/modules/media', () => ({
  MediaClient: {
    getMediaSize: vi.fn(),
  }
}));

vi.mock('@/modules/catalog', () => ({
  CatalogClient: {
    countProducts: vi.fn(),
  }
}));

vi.mock('@/modules/shared/core/event-bus', () => ({
  eventBus: {
    request: vi.fn(async (channel, data) => {
      if (channel === 'request.content.countPosts') {
        return PostClient.countPosts(data.siteId);
      }
      if (channel === 'request.catalog.countProducts') {
        return CatalogClient.countProducts(data.siteId);
      }
      if (channel === 'request.content.countTestimonials') {
        return PostClient.countTestimonials(data.siteId);
      }
      if (channel === 'request.content.getMediaSize') {
        return MediaClient.getMediaSize(data.siteId);
      }
      return 0;
    }),
    subscribe: vi.fn(),
    publish: vi.fn(),
    init: vi.fn(),
    disconnect: vi.fn(),
  }
}));

import { db } from '@/lib/core/db';
import { PostClient } from '@/modules/post';
import { MediaClient } from '@/modules/media';
import { CatalogClient } from '@/modules/catalog';

describe('lib/subscription-limits.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSiteLimit', () => {
    it('should return not allowed when no subscription', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
      
      const result = await SubscriptionClient.checkSiteLimit('site-1', 'maxPosts');
      
      expect(result).toEqual({ allowed: false, message: expect.stringContaining('subscription') });
    });

    it('should return allowed when plan has -1 (unlimited)', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Pro', maxPosts: -1, features: { hasBlog: true } }
      } as any);
      
      const result = await SubscriptionClient.checkSiteLimit('site-1', 'maxPosts');
      
      expect(result).toEqual({ allowed: true });
    });

    it('should return allowed when under limit', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Basic', maxPosts: 10, features: { hasBlog: true } }
      } as any);
      
      vi.mocked(PostClient.countPosts).mockResolvedValue(5);
      
      const result = await SubscriptionClient.checkSiteLimit('site-1', 'maxPosts');
      
      expect(result).toEqual({ allowed: true });
    });

    it('should return not allowed when at limit', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Basic', maxPosts: 10, features: { hasBlog: true } }
      } as any);
      
      vi.mocked(PostClient.countPosts).mockResolvedValue(10);
      
      const result = await SubscriptionClient.checkSiteLimit('site-1', 'maxPosts');
      
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('10');
      expect(result.message).toContain('posts');
    });

    it('should handle different limit types', async () => {
      vi.mocked(db.subscription.findFirst).mockResolvedValue({
        plan: { name: 'Basic', maxProducts: 5, features: { hasProducts: true } }
      } as any);
      
      vi.mocked(CatalogClient.countProducts).mockResolvedValue(6);
      
      const result = await SubscriptionClient.checkSiteLimit('site-1', 'maxProducts');
      
      expect(result.allowed).toBe(false);
    });
  });
});