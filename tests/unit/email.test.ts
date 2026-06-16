import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/core/db';
import { Resend } from 'resend';
import {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendWithdrawalStatusEmail,
  sendFollowupEmail,
  sendTrialExtendedEmail,
  sendDomainVerifiedEmail,
  sendSubscriptionCancelledEmail,
} from '@/modules/notification';

// Create mock function for Resend email sending
const mockSend = vi.fn();

// Mock the Resend library
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

// Mock the database client
vi.mock('@/lib/core/db', () => ({
  db: {
    platformSettings: {
      findUnique: vi.fn(),
    },
  },
}));

describe('lib/services/email.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on console to avoid cluttering test outputs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('sendEmail', () => {
    it('should return simulated response if Resend API key is not configured', async () => {
      vi.mocked(db.platformSettings.findUnique).mockResolvedValue(null);

      const result = await sendEmail({
        to: 'tenant@example.com',
        subject: 'Test Subject',
        html: '<p>Test Body</p>',
      });

      expect(result).toEqual({ success: false, error: 'RESEND_API_KEY_NOT_CONFIGURED' });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should send email using configured sender name and address if API key exists', async () => {
      vi.mocked(db.platformSettings.findUnique).mockResolvedValue({
        id: 'global',
        resendApiKey: 're_valid_api_key_123',
        emailSenderName: 'Custom Brand',
        emailSenderAddress: 'hello@brand.com',
      } as any);

      mockSend.mockResolvedValue({
        data: { id: 'email_msg_id' },
        error: null,
      });

      const result = await sendEmail({
        to: 'tenant@example.com',
        subject: 'Hello Tenant',
        html: '<p>Welcome</p>',
      });

      expect(result).toEqual({ success: true, id: 'email_msg_id' });
      expect(Resend).toHaveBeenCalledWith('re_valid_api_key_123');
      expect(mockSend).toHaveBeenCalledWith({
        from: 'Custom Brand <hello@brand.com>',
        to: 'tenant@example.com',
        subject: 'Hello Tenant',
        html: '<p>Welcome</p>',
        replyTo: undefined,
      });
    });

    it('should fall back to defaults if sender address/name is not configured in database', async () => {
      vi.mocked(db.platformSettings.findUnique).mockResolvedValue({
        id: 'global',
        resendApiKey: 're_valid_api_key_123',
        emailSenderName: null,
        emailSenderAddress: null,
      } as any);

      mockSend.mockResolvedValue({
        data: { id: 'email_msg_id_2' },
        error: null,
      });

      const result = await sendEmail({
        to: 'tenant@example.com',
        subject: 'Defaults Test',
        html: '<p>Welcome</p>',
      });

      expect(result).toEqual({ success: true, id: 'email_msg_id_2' });
      expect(mockSend).toHaveBeenCalledWith({
        from: 'SitusBisnis <noreply@situsbisnis.com>',
        to: 'tenant@example.com',
        subject: 'Defaults Test',
        html: '<p>Welcome</p>',
        replyTo: undefined,
      });
    });

    it('should return error response if Resend API returns an error', async () => {
      vi.mocked(db.platformSettings.findUnique).mockResolvedValue({
        id: 'global',
        resendApiKey: 're_valid_api_key_123',
      } as any);

      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API Key' },
      });

      const result = await sendEmail({
        to: 'tenant@example.com',
        subject: 'Fail Test',
        html: '<p>Test</p>',
      });

      expect(result).toEqual({ success: false, error: 'Invalid API Key' });
    });

    it('should catch exceptions and return error details', async () => {
      vi.mocked(db.platformSettings.findUnique).mockResolvedValue({
        id: 'global',
        resendApiKey: 're_valid_api_key_123',
      } as any);

      mockSend.mockRejectedValue(new Error('Network Failure'));

      const result = await sendEmail({
        to: 'tenant@example.com',
        subject: 'Exception Test',
        html: '<p>Test</p>',
      });

      expect(result).toEqual({ success: false, error: 'Network Failure' });
    });
  });

  describe('Template Triggers', () => {
    beforeEach(() => {
      vi.mocked(db.platformSettings.findUnique).mockResolvedValue({
        id: 'global',
        resendApiKey: 're_valid_api_key_123',
      } as any);
      mockSend.mockResolvedValue({ data: { id: 'msg_id' }, error: null });
    });

    it('sendWelcomeEmail should format template and trigger sendEmail', async () => {
      const result = await sendWelcomeEmail('user@test.com', 'Budi', 'Toko Kue Budi');

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Selamat Datang di Toko Kue Budi! 🎉',
        html: expect.stringContaining('Selamat Datang, Budi!'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('Toko Kue Budi'),
      }));
    });

    it('sendPaymentSuccessEmail should format template and trigger sendEmail', async () => {
      const result = await sendPaymentSuccessEmail({
        toEmail: 'user@test.com',
        userName: 'Budi',
        siteName: 'Toko Kue Budi',
        planName: 'pro',
        amount: 'Rp 150.000',
        endDate: '27 Juni 2026',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Pembayaran Berhasil - Akun PRO Toko Kue Budi 🎉',
        html: expect.stringContaining('PRO'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('Rp 150.000'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('27 Juni 2026'),
      }));
    });

    it('sendWithdrawalStatusEmail should format approved status correctly', async () => {
      const result = await sendWithdrawalStatusEmail({
        toEmail: 'affiliate@test.com',
        userName: 'Siti',
        amount: 'Rp 500.000',
        status: 'approved',
        bankDetails: 'Bank BCA - 123456789',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'affiliate@test.com',
        subject: 'Penarikan Komisi Afiliasi Disetujui! 💸',
        html: expect.stringContaining('DISETUJUI & DITRANSFER'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('#10b981'), // Success color
      }));
    });

    it('sendWithdrawalStatusEmail should format rejected status correctly', async () => {
      const result = await sendWithdrawalStatusEmail({
        toEmail: 'affiliate@test.com',
        userName: 'Siti',
        amount: 'Rp 500.000',
        status: 'rejected',
        bankDetails: 'Bank BCA - 123456789',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'affiliate@test.com',
        subject: 'Penarikan Komisi Afiliasi Ditolak ⚠️',
        html: expect.stringContaining('DITOLAK'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('#ef4444'), // Rejection color
      }));
    });

    it('sendFollowupEmail should format body text newlines and trigger sendEmail', async () => {
      const result = await sendFollowupEmail({
        toEmail: 'user@test.com',
        userName: 'Budi',
        subject: 'Manual Update Needed',
        message: 'Line one\nLine two',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Manual Update Needed',
        html: expect.stringContaining('Line one<br />Line two'),
      }));
    });

    it('sendFollowupEmail should parse WhatsApp markdown to HTML elements', async () => {
      const result = await sendFollowupEmail({
        toEmail: 'user@test.com',
        userName: 'Budi',
        subject: 'Markdown Test',
        message: 'Hello *Budi*, please visit _SitusBisnis_ at https://situsbisnis.com/dashboard/billing to review ~expired~ plans.',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        html: expect.stringContaining('Hello <strong>Budi</strong>, please visit <em>SitusBisnis</em> at <a href="https://situsbisnis.com/dashboard/billing"'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('review <del>expired</del> plans.'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('href="https://situsbisnis.com/contact"'),
      }));
    });

    it('sendTrialExtendedEmail should format duration and expiry date', async () => {
      const result = await sendTrialExtendedEmail({
        toEmail: 'user@test.com',
        userName: 'Budi',
        siteName: 'Toko Kue',
        days: 7,
        newEndDate: '15 Juni 2026',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Masa Uji Coba (Trial) Toko Kue Diperpanjang! 🎁',
        html: expect.stringContaining('7 hari'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('15 Juni 2026'),
      }));
    });

    it('sendDomainVerifiedEmail should output the site and custom domain', async () => {
      const result = await sendDomainVerifiedEmail({
        toEmail: 'user@test.com',
        userName: 'Budi',
        siteName: 'Toko Kue',
        domain: 'kuebudi.com',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Custom Domain kuebudi.com Telah Aktif! 🚀',
        html: expect.stringContaining('https://kuebudi.com'),
      }));
    });

    it('sendSubscriptionCancelledEmail should show plan name and cancellation warn styling', async () => {
      const result = await sendSubscriptionCancelledEmail({
        toEmail: 'user@test.com',
        userName: 'Budi',
        siteName: 'Toko Kue',
        planName: 'pro',
      });

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        to: 'user@test.com',
        subject: 'Pemberitahuan Penangguhan Langganan Toko Kue ⚠️',
        html: expect.stringContaining('Layanan Langganan Ditangguhkan'),
      }));
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('PRO'),
      }));
    });
  });
});
