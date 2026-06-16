import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as updateTransaction } from '@/app/api/admin/transactions/update/route';
import { db } from '@/lib/core/db';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/core/db', () => ({
  db: {
    $transaction: vi.fn((cb) => cb(db)),
    paymentTransaction: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    platformSettings: {
      findUnique: vi.fn(),
    },
    commission: {
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    siteUser: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    coupon: {
      update: vi.fn(),
    },
    site: {
      findUnique: vi.fn(),
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
      if (channel === 'affiliate.commission.awarded') {
        const { awardAffiliateCommissionInternal } = await import('@/modules/auth/controllers/auth.controller');
        await awardAffiliateCommissionInternal(db, data);
      }
    }),
    subscribe: vi.fn(),
    init: vi.fn(),
    disconnect: vi.fn(),
  }
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Admin Transactions Update API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 Unauthorized if no session or user is not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const req = new Request('http://localhost/api/admin/transactions/update', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'tx-1', status: 'approved' }),
    });
    const res = await updateTransaction(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 Bad Request if transactionId or status is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const req = new Request('http://localhost/api/admin/transactions/update', {
      method: 'POST',
      body: JSON.stringify({ status: 'approved' }),
    });
    const res = await updateTransaction(req);
    expect(res.status).toBe(400);
  });

  it('should award standard commission rate (20%) on first approved transaction', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const mockTx = {
      id: 'tx-1',
      status: 'pending',
      amount: '100000',
      siteId: 'site-1',
      planId: 'plan-1',
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
      affiliateRecurringCommissionRate: 10,
    } as any);

    vi.mocked(db.paymentTransaction.count).mockResolvedValue(1);
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.siteUser.findFirst).mockResolvedValue({ userId: 'user-1' } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      referredById: 'affiliate-1'
    } as any);
    vi.mocked(db.site.findUnique).mockResolvedValue({
      id: 'site-1',
      name: 'My Site',
    } as any);

    const req = new Request('http://localhost/api/admin/transactions/update', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'tx-1', status: 'approved' }),
    });
    const res = await updateTransaction(req);
    expect(res.status).toBe(200);

    expect(db.commission.create).toHaveBeenCalledWith({
      data: {
        userId: 'affiliate-1',
        amount: 20000,
        transactionId: 'tx-1',
        description: 'Komisi pembayaran dari situs My Site',
      },
    });
  });

  it('should award recurring commission rate (10%) on subsequent approved transactions', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const mockTx = {
      id: 'tx-2',
      status: 'pending',
      amount: '100000',
      siteId: 'site-1',
      planId: 'plan-1',
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
      affiliateRecurringCommissionRate: 10,
    } as any);

    // Mock count = 2 (representing that this is the second approved transaction)
    vi.mocked(db.paymentTransaction.count).mockResolvedValue(2);
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.siteUser.findFirst).mockResolvedValue({ userId: 'user-1' } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      referredById: 'affiliate-1'
    } as any);
    vi.mocked(db.site.findUnique).mockResolvedValue({
      id: 'site-1',
      name: 'My Site',
    } as any);

    const req = new Request('http://localhost/api/admin/transactions/update', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'tx-2', status: 'approved' }),
    });
    const res = await updateTransaction(req);
    expect(res.status).toBe(200);

    expect(db.commission.create).toHaveBeenCalledWith({
      data: {
        userId: 'affiliate-1',
        amount: 10000, // 10% of 100000
        transactionId: 'tx-2',
        description: 'Komisi pembayaran dari situs My Site',
      },
    });
  });

  it('should NOT award commission if isRecurringEnabled is false and count is greater than 1', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const mockTx = {
      id: 'tx-2',
      status: 'pending',
      amount: '100000',
      siteId: 'site-1',
      planId: 'plan-1',
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
      affiliateRecurringCommission: false,
      affiliateRecurringCommissionRate: 10,
    } as any);

    // Mock count = 2 (subsequent transaction)
    vi.mocked(db.paymentTransaction.count).mockResolvedValue(2);
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(db.siteUser.findFirst).mockResolvedValue({ userId: 'user-1' } as any);
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      referredById: 'affiliate-1'
    } as any);
    vi.mocked(db.site.findUnique).mockResolvedValue({
      id: 'site-1',
      name: 'My Site',
    } as any);

    const req = new Request('http://localhost/api/admin/transactions/update', {
      method: 'POST',
      body: JSON.stringify({ transactionId: 'tx-2', status: 'approved' }),
    });
    const res = await updateTransaction(req);
    expect(res.status).toBe(200);

    expect(db.commission.create).not.toHaveBeenCalled();
  });
});
