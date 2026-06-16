import { describe, it, expect } from 'vitest';
import { AppError } from '@/lib/api/errors';

describe('lib/api/errors.ts', () => {
  describe('AppError', () => {
    it('should create error with default status 500', () => {
      const error = new AppError('Something went wrong');
      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
    });

    it('should create error with custom status', () => {
      const error = new AppError('Not found', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should include details when provided', () => {
      const details = { field: 'email', issue: 'required' };
      const error = new AppError('Validation failed', 400, details);
      expect(error.details).toEqual(details);
    });

    it('should have correct error name', () => {
      const error = new AppError('Test');
      expect(error.name).toBe('AppError');
    });

    it('should be instance of Error', () => {
      const error = new AppError('Test');
      expect(error).toBeInstanceOf(Error);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test');
      expect(error.stack).toBeDefined();
    });
  });
});
