import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as validateCoupon } from '@/app/api/billing/validate-coupon/route';
import { POST as upgradePlan } from '@/app/api/billing/upgrade/route';
import { POST as updateTransaction } from '@/app/api/admin/transactions/update/route';
import { db } from '@/lib/core/db';
import { getServerSession } from 'next-auth';
import { IdentityClient } from '@/modules/auth';
import { SiteClient } from '@/modules/site';

vi.mock('@/lib/core/db', () => ({
  db: {
    $transaction: vi.fn((cb) => cb(db)),
    coupon: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    plan: {
      findUnique: vi.fn(),
    },
    site: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    siteUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    paymentTransaction: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    platformSettings: {
      findUnique: vi.fn(),
    },
    commission: {
      create: vi.fn(),
    },
    eventOutbox: {
      create: vi.fn(({ data }) => Promise.resolve({
        id: 'outbox-1',
        eventName: data.eventName,
        payload: data.payload,
        sourceModule: data.sourceModule,
        status: data.status || 'pending'
      })),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/modules/shared/core/event-bus', () => ({
  eventBus: {
    publish: vi.fn(async (channel, data) => {
      // Handler komisi afiliasi jika ada
      if (channel === 'affiliate.commission.awarded') {
        const { awardAffiliateCommissionInternal } = await import('@/modules/auth/controllers/auth.controller');
        await awardAffiliateCommissionInternal(db, data);
      }
    }),
    request: vi.fn(async (channel, data) => {
      if (channel === 'request.tenant.verifyUserSiteAccess') {
        return SiteClient.verifyUserSiteAccess(data.userId, data.siteId);
      }
      if (channel === 'request.tenant.getSiteInfo') {
        return SiteClient.getSiteInfo(data.siteId);
      }
      if (channel === 'request.auth.getSiteOwner') {
        return IdentityClient.getSiteOwner(data.siteId);
      }
      if (channel === 'request.auth.updateUserReferrer') {
        return IdentityClient.updateUserReferrer(data.userId, data.referredById);
      }
      return null;
    }),
    subscribe: vi.fn(),
    init: vi.fn(),
    disconnect: vi.fn(),
  }
}));

vi.mock('@/modules/auth', () => ({
  IdentityClient: {
    getSiteOwner: vi.fn(),
    updateUserReferrer: vi.fn(),
    awardAffiliateCommission: vi.fn(),
  }
}));

vi.mock('@/modules/site', () => ({
  SiteClient: {
    verifyUserSiteAccess: vi.fn(),
    getSiteInfo: vi.fn(),
    getSiteContact: vi.fn(),
  }
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Coupon Discount System API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate-coupon route', () => {
    it('should validate percentage discount correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
      
      vi.mocked(db.coupon.findUnique).mockResolvedValue({
        id: 'coupon-1',
        code: 'PROMO20',
        discountType: 'percentage',
        discountValue: 20,
        isActive: true,
        expiryDate: null,
        maxUses: null,
        usedCount: 0,
      } as any);

      vi.mocked(db.plan.findUnique).mockResolvedValue({
        id: 'plan-1',
        price: '100000',
      } as any);

      const req = new Request('http://localhost/api/billing/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: 'PROMO20', planId: 'plan-1' }),
      });

      const res = await validateCoupon(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.discountAmount).toBe(20000);
      expect(data.finalPrice).toBe(80000);
    });

    it('should validate fixed discount correctly', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
      
      vi.mocked(db.coupon.findUnique).mockResolvedValue({
        id: 'coupon-2',
        code: 'PROMO50K',
        discountType: 'fixed',
        discountValue: 50000,
        isActive: true,
        expiryDate: null,
        maxUses: null,
        usedCount: 0,
      } as any);

      vi.mocked(db.plan.findUnique).mockResolvedValue({
        id: 'plan-1',
        price: '150000',
      } as any);

      const req = new Request('http://localhost/api/billing/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: 'PROMO50K', planId: 'plan-1' }),
      });

      const res = await validateCoupon(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.discountAmount).toBe(50000);
      expect(data.finalPrice).toBe(100000);
    });

    it('should return error for expired coupons', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
      
      vi.mocked(db.coupon.findUnique).mockResolvedValue({
        id: 'coupon-3',
        code: 'OLD',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        expiryDate: new Date('2020-01-01'),
        maxUses: null,
        usedCount: 0,
      } as any);

      const req = new Request('http://localhost/api/billing/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: 'OLD', planId: 'plan-1' }),
      });

      const res = await validateCoupon(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('kedaluwarsa');
    });

    it('should return error for exhausted coupons', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
      
      vi.mocked(db.coupon.findUnique).mockResolvedValue({
        id: 'coupon-4',
        code: 'LIMITED',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        expiryDate: null,
        maxUses: 5,
        usedCount: 5,
      } as any);

      const req = new Request('http://localhost/api/billing/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: 'LIMITED', planId: 'plan-1' }),
      });

      const res = await validateCoupon(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Batas pemakaian');
    });
  });

  describe('upgrade route integration', () => {
    it('should apply discount and auto-associate affiliate on upgrade request', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-1', role: 'user' } } as any);

      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        name: 'Situs Budi',
        customDomain: null,
      } as any);

      vi.mocked(SiteClient.verifyUserSiteAccess).mockResolvedValue(true);
      vi.mocked(IdentityClient.getSiteOwner).mockResolvedValue({
        id: 'user-1',
        name: 'Budi',
        email: 'budi@example.com',
        referredById: null
      } as any);

      vi.mocked(db.plan.findUnique).mockResolvedValue({
        id: 'plan-1',
        price: '100000',
      } as any);

      vi.mocked(db.coupon.findUnique).mockResolvedValue({
        id: 'coupon-aff',
        code: 'BUDIPROMO',
        discountType: 'percentage',
        discountValue: 15,
        isActive: true,
        expiryDate: null,
        maxUses: null,
        usedCount: 0,
        affiliateId: 'affiliate-bob',
      } as any);

      vi.mocked(db.paymentTransaction.findFirst).mockResolvedValue(null);

      const req = new Request('http://localhost/api/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ siteId: 'site-1', planId: 'plan-1', couponCode: 'BUDIPROMO' }),
      });

      await upgradePlan(req);

      // Verify that user referredById was automatically linked to affiliate-bob
      expect(IdentityClient.updateUserReferrer).toHaveBeenCalledWith('user-1', 'affiliate-bob');

      // Verify that payment transaction was created with the correct discounted amount (85000) and couponId
      expect(db.paymentTransaction.create).toHaveBeenCalledWith({
        data: {
          siteId: 'site-1',
          planId: 'plan-1',
          amount: 85000,
          status: 'pending',
          couponId: 'coupon-aff',
          paymentMethod: 'manual',
        },
      });
    });
  });

  describe('transaction status update', () => {
    it('should increment coupon usedCount when transaction is approved', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as any);

      const mockTx = {
        id: 'tx-10',
        status: 'pending',
        amount: '85000',
        siteId: 'site-1',
        planId: 'plan-1',
        couponId: 'coupon-aff',
        addonType: null,
        plan: { interval: 'month' },
      };

      vi.mocked(db.paymentTransaction.findUnique).mockResolvedValue(mockTx as any);
      vi.mocked(db.paymentTransaction.update).mockResolvedValue({
        ...mockTx,
        status: 'approved',
      } as any);

      vi.mocked(db.platformSettings.findUnique).mockResolvedValue({
        id: 'global',
        affiliateCommissionRate: 20,
        affiliateRecurringCommission: true,
      } as any);

      vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
      vi.mocked(db.siteUser.findFirst).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: 'user-1',
        referredById: 'affiliate-bob'
      } as any);
      vi.mocked(db.site.findUnique).mockResolvedValue({
        id: 'site-1',
        name: 'My Site',
      } as any);

      const req = new Request('http://localhost/api/admin/transactions/update', {
        method: 'POST',
        body: JSON.stringify({ transactionId: 'tx-10', status: 'approved' }),
      });

      const res = await updateTransaction(req);
      expect(res.status).toBe(200);

      // Verify that Coupon usedCount was incremented on approval
      expect(db.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coupon-aff' },
        data: { usedCount: { increment: 1 } },
      });
    });
  });
});
