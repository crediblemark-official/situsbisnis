import { describe, it, expect } from 'vitest';
import { getCurrencySymbol, formatPrice } from '@/lib/billing/currency';

describe('lib/billing/currency.ts', () => {
  describe('getCurrencySymbol', () => {
    it('should return $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return Rp for IDR', () => {
      expect(getCurrencySymbol('IDR')).toBe('Rp ');
    });

    it('should return € for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return £ for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£');
    });

    it('should return code for unknown currency', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });

    it('should handle lowercase input', () => {
      expect(getCurrencySymbol('usd')).toBe('$');
    });

    it('should default to USD', () => {
      expect(getCurrencySymbol()).toBe('$');
    });
  });

  describe('formatPrice', () => {
    it('should format USD correctly', () => {
      expect(formatPrice(1000, 'USD')).toBe('$1,000.00');
    });

    it('should format IDR correctly (no decimals)', () => {
      expect(formatPrice(10000, 'IDR')).toBe('Rp 10.000');
    });

    it('should handle string price', () => {
      expect(formatPrice('50.5', 'USD')).toBe('$50.50');
    });

    it('should handle null price', () => {
      expect(formatPrice(null, 'USD')).toBe('$0.00');
    });

    it('should handle undefined price', () => {
      expect(formatPrice(undefined, 'USD')).toBe('$0.00');
    });

    it('should default to USD', () => {
      expect(formatPrice(100)).toBe('$100.00');
    });
  });
});
