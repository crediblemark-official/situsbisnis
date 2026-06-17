import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hooks } from '@/lib/core/hooks';

describe('lib/core/hooks.ts', () => {
  beforeEach(() => {
    hooks['actions'].clear();
    hooks['filters'].clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('addAction / doAction', () => {
    it('should execute registered action callbacks', () => {
      const callback = vi.fn();
      hooks.addAction('test:action', callback);
      hooks.doAction('test:action', 'arg1', 'arg2');
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should not throw if action has no callbacks', () => {
      expect(() => hooks.doAction('nonexistent')).not.toThrow();
    });

    it('should execute multiple callbacks for same action', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      hooks.addAction('multi', cb1);
      hooks.addAction('multi', cb2);
      hooks.doAction('multi');
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });

    it('should catch errors in callbacks', () => {
      const errorCb = vi.fn(() => { throw new Error('Test error'); });
      const goodCb = vi.fn();
      hooks.addAction('error-test', errorCb);
      hooks.addAction('error-test', goodCb);
      expect(() => hooks.doAction('error-test')).not.toThrow();
      expect(goodCb).toHaveBeenCalled();
    });
  });

  describe('addFilter / applyFilters', () => {
    it('should apply filter to value', () => {
      hooks.addFilter('test:filter', (value: string) => value.toUpperCase());
      const result = hooks.applyFilters('test:filter', 'hello');
      expect(result).toBe('HELLO');
    });

    it('should return original value if no filters', () => {
      const result = hooks.applyFilters('nonexistent', 'hello');
      expect(result).toBe('hello');
    });

    it('should chain multiple filters', () => {
      hooks.addFilter('chain', (v: string) => v + ' world');
      hooks.addFilter('chain', (v: string) => v + '!');
      const result = hooks.applyFilters('chain', 'hello');
      expect(result).toBe('hello world!');
    });

    it('should pass additional args to filters', () => {
      const filter = vi.fn((value: string, suffix: string) => value + suffix);
      hooks.addFilter('args-test', filter);
      hooks.applyFilters('args-test', 'hello', ' world');
      expect(filter).toHaveBeenCalledWith('hello', ' world');
    });

    it('should catch errors in filters and return accumulator', () => {
      hooks.addFilter('error-filter', () => { throw new Error('Fail'); });
      hooks.addFilter('error-filter', (v: string) => v + ' ok');
      const result = hooks.applyFilters('error-filter', 'hello');
      expect(result).toBe('hello ok');
    });
  });
});
