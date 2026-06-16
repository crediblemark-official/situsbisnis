import { describe, it, expect } from 'vitest';
import { apiResponse, apiError } from '@/lib/api/utils';

describe('lib/api-utils.ts', () => {
  describe('apiResponse', () => {
    it('should return JSON response with 200 status', () => {
      const result = apiResponse({ data: 'test' });

      expect(result.status).toBe(200);
      expect(result.headers.get('content-type')).toContain('application/json');
    });

    it('should return JSON with custom status', () => {
      const result = apiResponse({ error: 'not found' }, 404);
      expect(result.status).toBe(404);
    });

    it('should handle empty data', () => {
      const result = apiResponse(null);
      expect(result.status).toBe(200);
    });
  });

  describe('apiError', () => {
    it('should return error response with 500 status', () => {
      const result = apiError('Internal Error');

      expect(result.status).toBe(500);
    });

    it('should return error with custom status', () => {
      const result = apiError('Not Found', 404);
      expect(result.status).toBe(404);
    });

    it('should include details when provided', () => {
      const result = apiError('Validation Error', 400, { field: 'error' });
      expect(result.status).toBe(400);
    });
  });
});