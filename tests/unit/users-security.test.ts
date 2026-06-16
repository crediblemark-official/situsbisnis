import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createUser } from '@/app/api/users/route';
import { PATCH as updateUser } from '@/app/api/users/[id]/route';
import { db } from '@/lib/core/db';
import { getApiContext, validateBody } from '@/lib/api/utils';

vi.mock('@/lib/core/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    site: {
      update: vi.fn(),
    },
    siteUser: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/utils', () => ({
  getApiContext: vi.fn(),
  apiResponse: vi.fn((data) => ({ status: 200, json: async () => data })),
  apiError: vi.fn((msg, status) => ({ status: status || 500, json: async () => ({ error: msg }) })),
  validateBody: vi.fn(),
}));

describe('User Security - Privilege Escalation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/users (Create User)', () => {
    it('should prevent non-admin from creating an admin user', async () => {
      (getApiContext as any).mockResolvedValue({
        session: { user: { role: 'owner' } },
        siteId: 'site-1',
      });
      (validateBody as any).mockResolvedValue({
        data: { email: 'newadmin@example.com', role: 'admin' },
      });

      const req = new Request('http://localhost/api/users', { method: 'POST' });
      const response: any = await createUser(req);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Only platform admins can assign the admin role');
    });

    it('should allow admin to create an admin user', async () => {
      (getApiContext as any).mockResolvedValue({
        session: { user: { role: 'admin' } },
        siteId: 'site-1',
      });
      (validateBody as any).mockResolvedValue({
        data: { email: 'newadmin@example.com', role: 'admin' },
      });
      (db.user.findUnique as any).mockResolvedValue(null);
      (db.user.create as any).mockResolvedValue({ id: 'new-id', email: 'newadmin@example.com', role: 'admin' });

      const req = new Request('http://localhost/api/users', { method: 'POST' });
      const response: any = await createUser(req);

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/users/[id] (Update User)', () => {
    it('should prevent non-admin from promoting a user to admin', async () => {
      (getApiContext as any).mockResolvedValue({
        session: { user: { role: 'owner' } },
        siteId: 'site-1',
      });
      (validateBody as any).mockResolvedValue({
        data: { role: 'admin' },
      });
      // Target user is currently a regular user
      (db.user.findUnique as any).mockResolvedValue({ id: 'user-id', role: 'user' });
      // Belonging check passes
      (db.siteUser.findFirst as any).mockResolvedValue({ id: 'user-id' });

      const req = new Request('http://localhost/api/users/user-id', { method: 'PATCH' });
      const response: any = await updateUser(req, { params: Promise.resolve({ id: 'user-id' }) });

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Only platform admins can assign the admin role');
    });

    it('should prevent non-admin from modifying an existing admin user', async () => {
        (getApiContext as any).mockResolvedValue({
          session: { user: { role: 'owner' } },
          siteId: 'site-1',
        });
        (validateBody as any).mockResolvedValue({
          data: { name: 'New Name' },
        });
        // Target user is already an admin
        (db.user.findUnique as any).mockResolvedValue({ id: 'admin-id', role: 'admin' });
        // Belonging check passes (admin might be assigned to this site)
        (db.siteUser.findFirst as any).mockResolvedValue({ id: 'admin-id' });

        const req = new Request('http://localhost/api/users/admin-id', { method: 'PATCH' });
        const response: any = await updateUser(req, { params: Promise.resolve({ id: 'admin-id' }) });

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.error).toContain('Cannot modify a platform admin');
      });

    it('should allow admin to promote a user to admin', async () => {
      (getApiContext as any).mockResolvedValue({
        session: { user: { role: 'admin' } },
        siteId: 'site-1',
      });
      (validateBody as any).mockResolvedValue({
        data: { role: 'admin' },
      });
      (db.user.findUnique as any).mockResolvedValue({ id: 'user-id', role: 'user' });

      const req = new Request('http://localhost/api/users/user-id', { method: 'PATCH' });
      const response: any = await updateUser(req, { params: Promise.resolve({ id: 'user-id' }) });

      expect(response.status).toBe(200);
      expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: 'admin' })
      }));
    });
  });
});
