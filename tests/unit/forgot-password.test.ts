import { describe, it, expect, vi, beforeEach } from 'vitest';
import { forgotPasswordApi, resetPasswordApi } from '@/modules/auth/controllers/forgot-password.controller';
import { db } from '@/lib/core/db';
import { sendEmail } from '@/modules/notification/services/email.service';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/core/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/modules/notification/services/email.service', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_new_pw'),
  },
}));

function createMockRequest(body: any) {
  return new Request('http://localhost:3000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('Forgot/Reset Password Controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forgotPasswordApi', () => {
    it('should return 400 if email is invalid', async () => {
      const req = createMockRequest({ email: 'not-an-email' });
      const res = await forgotPasswordApi(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validasi gagal');
    });

    it('should return success even if user not found (security to prevent enumeration)', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ email: 'nonexistent@example.com' });
      const res = await forgotPasswordApi(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(db.passwordResetToken.create).not.toHaveBeenCalled();
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it('should create token and send email if user exists', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const req = createMockRequest({ email: 'user@example.com' });
      const res = await forgotPasswordApi(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      
      expect(db.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });
      expect(db.passwordResetToken.create).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
    });
  });

  describe('resetPasswordApi', () => {
    it('should return 400 if validation fails (e.g. password too short)', async () => {
      const req = createMockRequest({ token: 'some-token', password: 'short' });
      const res = await resetPasswordApi(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Validasi gagal');
    });

    it('should return 400 if token is invalid or expired', async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(null);

      const req = createMockRequest({ token: 'invalid-token', password: 'password123' });
      const res = await resetPasswordApi(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Tautan reset tidak valid atau telah kedaluwarsa');
    });

    it('should reset password successfully if token is valid', async () => {
      const mockResetToken = {
        id: 'token-1',
        email: 'user@example.com',
        token: 'valid-token',
        expires: new Date(Date.now() + 100000),
      };
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(mockResetToken as any);

      const req = createMockRequest({ token: 'valid-token', password: 'password123' });
      const res = await resetPasswordApi(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        data: { password: 'hashed_new_pw' },
      });
      expect(db.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
      });
    });
  });
});
