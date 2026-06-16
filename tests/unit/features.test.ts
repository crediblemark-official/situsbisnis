import { describe, it, expect } from 'vitest';
import { isFeatureEnabled } from '@/lib/billing/features';

describe('lib/billing/features.ts', () => {
  describe('isFeatureEnabled', () => {
    it('should return true when feature is explicitly enabled', () => {
      const result = isFeatureEnabled('Pro', { hasBlog: true }, 'hasBlog');
      expect(result).toBe(true);
    });

    it('should return false when feature is explicitly disabled', () => {
      const result = isFeatureEnabled('Free', { hasProducts: false }, 'hasProducts');
      expect(result).toBe(false);
    });

    it('should return false by default when feature is missing from plan features', () => {
      const result = isFeatureEnabled('Pro', {}, 'hasCustomDomain');
      expect(result).toBe(false);
    });

    it('should return false for unknown features', () => {
      const result = isFeatureEnabled('Pro', {}, 'unknownFeature');
      expect(result).toBe(false);
    });

    it('should handle null or undefined features object by returning false (disabled by default)', () => {
      expect(isFeatureEnabled('Pro', null as any, 'hasBlog')).toBe(false);
      expect(isFeatureEnabled('Pro', undefined as any, 'hasBlog')).toBe(false);
    });
  });
});
