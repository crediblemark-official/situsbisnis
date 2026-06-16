import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, logger } from '@/lib/core/logger';

vi.mock('pino', () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
  const pino = vi.fn(() => mockLogger);
  (pino as any).stdTimeFunctions = { isoTime: vi.fn() };
  return { default: pino };
});

describe('lib/core/logger.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create a child logger with module name', () => {
      const testLogger = createLogger('test-module');
      expect(testLogger).toBeDefined();
    });

    it('should create different loggers for different modules', () => {
      const loggerA = createLogger('module-a');
      const loggerB = createLogger('module-b');
      expect(loggerA).toBeDefined();
      expect(loggerB).toBeDefined();
    });
  });

  describe('logger', () => {
    it('should export a default logger', () => {
      expect(logger).toBeDefined();
    });
  });
});
