import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH as handleSubscriptionAction } from '@/app/api/admin/subscriptions/[id]/route';
import { db } from '@/lib/core/db';
import { getApiContext } from '@/lib/api/utils';
import { sendWhatsAppNotification } from '@/lib/services/whatsapp';
import { eventBus } from '@/modules/shared/core/event-bus';
import { IdentityClient } from '@/modules/auth';

vi.mock('@/lib/core/db', () => ({
  db: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    site: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/utils', () => ({
  getApiContext: vi.fn(),
  apiResponse: vi.fn((data) => ({ status: 200, json: async () => data })),
  apiError: vi.fn((msg, status) => ({ status: status || 500, json: async () => ({ error: msg }) })),
}));

vi.mock('@/lib/services/whatsapp', () => ({
  sendWhatsAppNotification: vi.fn(),
}));

// eventBus di-mock di bawah, tidak perlu me-mock modul notification langsung

vi.mock('@/modules/auth', () => ({
  IdentityClient: {
    getSiteOwner: vi.fn(),
  }
}));

vi.mock('@/modules/shared/core/event-bus', () => ({
  eventBus: {
    publish: vi.fn(),
    request: vi.fn(async (channel, data) => {
      if (channel === 'request.auth.getSiteOwner') {
        return IdentityClient.getSiteOwner(data.siteId);
      }
      return null;
    }),
    subscribe: vi.fn(),
    init: vi.fn(),
    disconnect: vi.fn(),
  }
}));

describe('Subscription Admin API Route (PATCH /api/admin/subscriptions/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return error if API context checks fail (unauthorized)', async () => {
    vi.mocked(getApiContext).mockResolvedValue({
      session: null,
      error: 'Unauthorized',
      status: 401,
    } as any);

    const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel' }),
    });

    const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
    expect(res.status).toBe(401);
  });

  it('should return 404 if subscription is not found', async () => {
    vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);
    vi.mocked(db.subscription.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel' }),
    });

    const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
    expect(res.status).toBe(404);
  });

  describe('Action: extend', () => {
    it('should upgrade to Pro and set endDate if current plan is Free', async () => {
      vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);

      const mockSub = {
        id: 'sub-1',
        plan: { name: 'Free' },
        siteId: 'site-1',
      };
      vi.mocked(db.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        name: 'Free Site',
        users: []
      } as any);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue(null);
      vi.mocked(db.plan.findFirst).mockResolvedValue({ id: 'pro-plan-id', name: 'Pro' } as any);
      vi.mocked(db.subscription.update).mockResolvedValue({
        id: 'sub-1',
        endDate: new Date(),
        plan: { name: 'Pro', id: 'pro-plan-id' },
      } as any);

      const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'extend', days: 10 }),
      });

      const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
      expect(res.status).toBe(200);
      expect(db.plan.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { equals: 'Pro', mode: 'insensitive' } },
        })
      );
      expect(db.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({
            planId: 'pro-plan-id',
            status: 'active',
          }),
        })
      );
    });

    it('should extend existing trialEnd if plan is not Free and trial is active', async () => {
      vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);

      const baseDate = new Date('2026-05-01T12:00:00.000Z');
      const mockSub = {
        id: 'sub-2',
        plan: { name: 'Pro' },
        trialEndsAt: baseDate,
        endDate: null,
        siteId: 'site-2'
      };
      vi.mocked(db.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-2',
        name: 'Pro Site',
        users: []
      } as any);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue(null);
      vi.mocked(db.subscription.update).mockResolvedValue({
        id: 'sub-2',
        trialEndsAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        plan: { name: 'Pro' },
      } as any);

      const req = new Request('http://localhost/api/admin/subscriptions/sub-2', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'extend' }), // default 7 days
      });

      const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-2' }) });
      expect(res.status).toBe(200);
      expect(db.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-2' },
          data: expect.objectContaining({
            trialEndsAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          }),
        })
      );
    });
  });

  describe('Action: cancel', () => {
    it('should cancel subscription and trigger cancellation email', async () => {
      vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);

      const mockSub = {
        id: 'sub-1',
        plan: { name: 'Pro' },
        siteId: 'site-1',
      };
      vi.mocked(db.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        name: 'My Site',
        users: [{ id: 'user-1', name: 'John Doe', email: 'john@example.com' }],
      } as any);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        referredById: null
      });
      vi.mocked(db.subscription.update).mockResolvedValue({} as any);

      const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel' }),
      });

      const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
      expect(res.status).toBe(200);
      expect(db.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'cancelled' },
      });
      expect(eventBus.publish).toHaveBeenCalledWith(
        "notification.email.send",
        expect.objectContaining({
          template: "subscriptionCancelled",
          payload: expect.objectContaining({
            toEmail: 'john@example.com',
            userName: 'John Doe',
            siteName: 'My Site',
            planName: 'Pro'
          })
        }),
        "billing"
      );
    });
  });

  describe('Action: update_plan', () => {
    it('should update the subscription plan and activate it', async () => {
      vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);

      const mockSub = {
        id: 'sub-1',
        plan: { name: 'Pro' },
        siteId: 'site-1',
      };
      vi.mocked(db.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        users: [],
      } as any);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue(null);
      vi.mocked(db.subscription.update).mockResolvedValue({
        id: 'sub-1',
        plan: { name: 'Enterprise' },
      } as any);

      const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'update_plan', planId: 'ent-plan-id' }),
      });

      const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
      expect(res.status).toBe(200);
      expect(db.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: {
            planId: 'ent-plan-id',
            status: 'active',
          },
        })
      );
    });
  });

  describe('Action: followup (WhatsApp)', () => {
    it('should trigger WhatsApp follow-up notification', async () => {
      vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);

      const mockSub = { id: 'sub-1', plan: { name: 'Pro' }, siteId: 'site-1' };
      vi.mocked(db.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        users: [],
      } as any);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue(null);
      vi.mocked(sendWhatsAppNotification).mockResolvedValue({ success: true, result: 'wa_sent_id' as any });

      const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'followup', phone: '62812345678', message: 'Hello WA' }),
      });

      const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
      expect(res.status).toBe(200);
      expect(sendWhatsAppNotification).toHaveBeenCalledWith('62812345678', 'Hello WA');
    });
  });

  describe('Action: followup_email (Resend)', () => {
    it('should trigger Email follow-up using Resend', async () => {
      vi.mocked(getApiContext).mockResolvedValue({ session: { user: { role: 'admin' } } } as any);

      const mockSub = {
        id: 'sub-1',
        plan: { name: 'Pro' },
        siteId: 'site-1',
      };
      vi.mocked(db.subscription.findUnique).mockResolvedValue(mockSub as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        users: [{ id: 'user-1', name: 'John Owner' }],
      } as any);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue({
        id: 'user-1',
        name: 'John Owner',
        email: 'owner@site.com',
        referredById: null
      });
      // eventBus.publish akan dipanggil untuk followup email

      const req = new Request('http://localhost/api/admin/subscriptions/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'followup_email',
          email: 'owner@site.com',
          message: 'Hello Email Followup',
        }),
      });

      const res = await handleSubscriptionAction(req, { params: Promise.resolve({ id: 'sub-1' }) });
      expect(res.status).toBe(200);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "notification.email.send",
        expect.objectContaining({
          template: "followup",
          payload: expect.objectContaining({
            toEmail: 'owner@site.com',
            userName: 'John Owner',
            subject: 'Pesan Penting Terkait Layanan Website Anda di SitusBisnis',
            message: 'Hello Email Followup'
          })
        }),
        "billing"
      );
    });
  });
});
