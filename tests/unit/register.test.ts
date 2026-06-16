import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { db } from '@/lib/core/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/modules/tenant/services/email.service';

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

vi.mock('@/modules/tenant/services/email.service', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Registration API Route (POST /api/auth/register)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock for cookies to return an empty store
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);
  });

  it('should return 400 if email or password is empty', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: '' }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email dan password wajib diisi');
  });

  it('should return 400 if phone number is empty', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', password: 'password123', phone: '' }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Nomor HP wajib diisi');
  });

  it('should return 400 if phone format is invalid', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'password123',
        phone: 'abc12345',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Nomor HP tidak valid');
  });

  it('should return 400 if email is already registered', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-1' } as any);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'exists@example.com',
        password: 'password123',
        phone: '081234567890',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email sudah terdaftar');
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
    vi.mocked(sendWelcomeEmail).mockResolvedValue({ success: true } as any);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'password123',
        phone: '0812-3456-7890',
        name: 'New Owner',
      }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.id).toBe('user-new');

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
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      'new@example.com',
      'New Owner',
      'SitusBisnis'
    );
  });
});
