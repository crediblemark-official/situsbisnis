import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerUserAction } from '@/modules/auth';
import { db } from '@/lib/core/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eventBus } from '@/modules/shared/core/event-bus';

vi.mock('@/lib/core/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock('@/modules/shared/core/event-bus', () => ({
  eventBus: {
    publish: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Registration Server Action (registerUserAction)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock for cookies to return an empty store
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  it('should return success: false if email or password is empty', async () => {
    const res = await registerUserAction({ email: '', password: '' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Email dan password wajib diisi');
  });

  it('should return success: false if phone number is empty', async () => {
    const res = await registerUserAction({ email: 'new@example.com', password: 'password123', phone: '' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Nomor HP wajib diisi');
  });

  it('should return success: false if phone format is invalid', async () => {
    const res = await registerUserAction({
      email: 'new@example.com',
      password: 'password123',
      phone: 'abc12345',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Nomor HP tidak valid');
  });

  it('should return success: false if email is already registered', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);

    const res = await registerUserAction({
      email: 'exists@example.com',
      password: 'password123',
      phone: '081234567890',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Email sudah terdaftar');
  });

  it('should register successfully, format phone, hash password, and trigger welcome email', async () => {
    // Mock database check: no existing email or phone
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    // Mock bcrypt hash
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed_pw' as any);

    // Mock cookies
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: 'REF123' }),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

    // Mock creation response
    const mockCreatedUser = {
      id: 'user-new',
      email: 'new@example.com',
      phone: '6281234567890',
      name: 'New Owner',
      referralCode: 'USERCODE',
    };
    vi.mocked(db.user.create).mockResolvedValue(mockCreatedUser as any);

    const res = await registerUserAction({
      email: 'new@example.com',
      password: 'password123',
      phone: '0812-3456-7890',
      name: 'New Owner',
    });

    expect(res.success).toBe(true);
    expect(res.user?.id).toBe('user-new');

    // Phone standardisation verification
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phone: '6281234567890',
          password: 'hashed_pw',
        }),
      })
    );

    // Welcome email trigger verification
    // Verifikasi pemicuan welcome email melalui event bus
    expect(eventBus.publish).toHaveBeenCalledWith(
      "notification.email.send",
      expect.objectContaining({
        template: "welcome",
        payload: expect.objectContaining({
          toEmail: 'new@example.com',
          userName: 'New Owner',
          siteName: 'SitusBisnis'
        })
      }),
      "auth"
    );
  });
});
