import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as updateWithdrawalHandler } from '@/app/api/admin/withdrawals/update/route';
import { db } from '@/lib/core/db';
import { getServerSession } from 'next-auth';
import { eventBus } from '@/modules/shared/core/event-bus';

vi.mock('@/lib/core/db', () => ({
  db: {
    $transaction: vi.fn((cb) => cb(db)),
    withdrawal: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/modules/shared/core/event-bus', () => ({
  eventBus: {
    publish: vi.fn(),
  },
}));

describe('Withdrawal Status Update API Route (POST /api/admin/withdrawals/update)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return 401 Unauthorized if user session is invalid or user is not an admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const req = new Request('http://localhost/api/admin/withdrawals/update', {
      method: 'POST',
      body: JSON.stringify({ withdrawalId: 'wd-1', status: 'approved' }),
    });

    const res = await updateWithdrawalHandler(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 Bad Request if withdrawalId or status is missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const req = new Request('http://localhost/api/admin/withdrawals/update', {
      method: 'POST',
      body: JSON.stringify({ status: 'approved' }),
    });

    const res = await updateWithdrawalHandler(req);
    expect(res.status).toBe(400);
  });

  it('should return 404 Not Found if the withdrawal request does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    vi.mocked(db.withdrawal.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost/api/admin/withdrawals/update', {
      method: 'POST',
      body: JSON.stringify({ withdrawalId: 'wd-nonexistent', status: 'approved' }),
    });

    const res = await updateWithdrawalHandler(req);
    expect(res.status).toBe(404);
  });

  it('should return 400 if the withdrawal has already been processed', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    vi.mocked(db.withdrawal.findUnique).mockResolvedValue({
      id: 'wd-1',
      status: 'approved',
    } as any);

    const req = new Request('http://localhost/api/admin/withdrawals/update', {
      method: 'POST',
      body: JSON.stringify({ withdrawalId: 'wd-1', status: 'approved' }),
    });

    const res = await updateWithdrawalHandler(req);
    expect(res.status).toBe(400);
  });

  it('should approve withdrawal successfully, updating status and sending email without refunding', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const mockWd = {
      id: 'wd-1',
      userId: 'user-affiliate',
      amount: 250000,
      status: 'pending',
      bankName: 'BCA',
      accountNumber: '987654321',
      accountName: 'Budi Santoso',
    };

    vi.mocked(db.withdrawal.findUnique).mockResolvedValue(mockWd as any);
    vi.mocked(db.withdrawal.update).mockResolvedValue({
      ...mockWd,
      status: 'approved',
      user: { email: 'affiliate@test.com', name: 'Budi' },
    } as any);

    const req = new Request('http://localhost/api/admin/withdrawals/update', {
      method: 'POST',
      body: JSON.stringify({ withdrawalId: 'wd-1', status: 'approved' }),
    });

    const res = await updateWithdrawalHandler(req);
    expect(res.status).toBe(200);

    // Verify DB update
    expect(db.withdrawal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wd-1' },
        data: { status: 'approved' },
      })
    );

    // Verify refund is NOT called for approval
    expect(db.user.update).not.toHaveBeenCalled();

    // Verify email notification
    expect(eventBus.publish).toHaveBeenCalledWith(
      "notification.email.send",
      expect.objectContaining({
        template: "withdrawalStatus",
        payload: expect.objectContaining({
          toEmail: 'affiliate@test.com',
          userName: 'Budi',
          status: 'approved',
          bankDetails: 'BCA - 987654321 (a/n Budi Santoso)',
        })
      }),
      "billing"
    );
  });

  it('should reject withdrawal successfully, updating status, refunding balance, and sending rejection email', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    } as any);

    const mockWd = {
      id: 'wd-2',
      userId: 'user-affiliate-2',
      amount: 150000,
      status: 'pending',
      bankName: 'Mandiri',
      accountNumber: '11223344',
      accountName: 'Siti Aminah',
    };

    vi.mocked(db.withdrawal.findUnique).mockResolvedValue(mockWd as any);
    vi.mocked(db.withdrawal.update).mockResolvedValue({
      ...mockWd,
      status: 'rejected',
      user: { email: 'affiliate2@test.com', name: 'Siti' },
    } as any);

    const req = new Request('http://localhost/api/admin/withdrawals/update', {
      method: 'POST',
      body: JSON.stringify({ withdrawalId: 'wd-2', status: 'rejected' }),
    });

    const res = await updateWithdrawalHandler(req);
    expect(res.status).toBe(200);

    // Verify refund to user balance
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-affiliate-2' },
        data: {
          affiliateBalance: {
            increment: 150000,
          },
        },
      })
    );

    // Verify email notification
    expect(eventBus.publish).toHaveBeenCalledWith(
      "notification.email.send",
      expect.objectContaining({
        template: "withdrawalStatus",
        payload: expect.objectContaining({
          toEmail: 'affiliate2@test.com',
          userName: 'Siti',
          status: 'rejected',
          bankDetails: 'Mandiri - 11223344 (a/n Siti Aminah)',
        })
      }),
      "billing"
    );
  });
});
