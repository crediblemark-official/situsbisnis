import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/utils/string';

describe('lib/utils/string.ts', () => {
  describe('slugify', () => {
    it('should convert spaces to hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });

    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('hello @ world!')).toBe('hello-world');
    });

    it('should replace multiple hyphens with single', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });

    it('should trim hyphens from start and end', () => {
      expect(slugify('-hello-world-')).toBe('hello-world');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('should handle numbers', () => {
      expect(slugify('hello 123 world')).toBe('hello-123-world');
    });

    it('should handle unicode characters', () => {
      expect(slugify('café résumé')).toBe('caf-rsum');
    });

    it('should trim whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });
  });
});
