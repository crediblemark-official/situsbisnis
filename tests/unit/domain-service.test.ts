import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DomainService } from '@/lib/services/domain.service';
import { db } from '@/lib/core/db';
import { verifyDomainConfig } from '@/lib/domains/verification';
import { DokployService } from '@/lib/services/dokploy.service';

vi.mock('@/lib/core/db', () => ({
  db: {
    site: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/domains/verification', () => ({
  verifyDomainConfig: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/services/dokploy.service', () => ({
  DokployService: {
    addDomain: vi.fn(),
    deleteDomain: vi.fn(),
  },
}));

describe('lib/services/domain.service.ts', () => {
  const siteId = 'site-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'situsbisnis.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('registerDomain', () => {
    it('should register a valid standard domain', async () => {
      vi.mocked(db.site.findFirst).mockResolvedValue(null);
      vi.mocked(db.site.update).mockResolvedValue({ id: siteId } as any);

      const result = await DomainService.registerDomain(siteId, 'butikku.id');
      expect(result.status).toBe('pending');
      expect(db.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: siteId },
          data: { customDomain: 'butikku.id', customDomainVerified: false },
        })
      );
    });

    it('should register a valid long TLD domain', async () => {
      vi.mocked(db.site.findFirst).mockResolvedValue(null);
      vi.mocked(db.site.update).mockResolvedValue({ id: siteId } as any);

      const result = await DomainService.registerDomain(siteId, 'my-shop.online');
      expect(result.status).toBe('pending');
      expect(db.site.update).toHaveBeenCalled();
    });

    it('should register a valid Punycode domain', async () => {
      vi.mocked(db.site.findFirst).mockResolvedValue(null);
      vi.mocked(db.site.update).mockResolvedValue({ id: siteId } as any);

      const result = await DomainService.registerDomain(siteId, 'xn--d1acufc.xn--p1ai');
      expect(result.status).toBe('pending');
      expect(db.site.update).toHaveBeenCalled();
    });

    it('should return error for invalid domain format', async () => {
      const result = await DomainService.registerDomain(siteId, 'invalid_domain');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Format domain tidak valid');
      expect(db.site.update).not.toHaveBeenCalled();
    });

    it('should return error if domain is platform root or subdomain', async () => {
      const result = await DomainService.registerDomain(siteId, 'sub.situsbisnis.com');
      expect(result.status).toBe('error');
      expect(result.message).toContain('Anda tidak dapat menggunakan domain utama');
    });
  });

  describe('verifyDomain', () => {
    it('should verify successfully when domain matches current custom domain and call DokployService.addDomain', async () => {
      vi.mocked(db.site.findUnique).mockResolvedValue({ customDomain: 'butikku.id' } as any);
      vi.mocked(verifyDomainConfig).mockResolvedValue({ valid: true, cname: true, aRecord: false, error: null });
      vi.mocked(db.site.update).mockResolvedValue({ id: siteId, name: 'Toko', users: [] } as any);
      vi.mocked(DokployService.addDomain).mockResolvedValue(true);

      const result = await DomainService.verifyDomain(siteId, 'butikku.id');
      expect(result.status).toBe('valid');
      expect(db.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: siteId },
          data: { customDomainVerified: true },
        })
      );
      expect(DokployService.addDomain).toHaveBeenCalledWith('butikku.id');
    });

    it('should fail verification if domain does not match current registered custom domain (prevention of race condition)', async () => {
      vi.mocked(db.site.findUnique).mockResolvedValue({ customDomain: 'new-domain.com' } as any);

      const result = await DomainService.verifyDomain(siteId, 'old-domain.com');
      expect(result.status).toBe('error');
      expect(result.message).toContain('tidak cocok dengan konfigurasi aktif');
      expect(db.site.update).not.toHaveBeenCalled();
      expect(verifyDomainConfig).not.toHaveBeenCalled();
      expect(DokployService.addDomain).not.toHaveBeenCalled();
    });
  });

  describe('removeDomain', () => {
    it('should delete domain from Dokploy and database', async () => {
      vi.mocked(db.site.update).mockResolvedValue({ subdomain: 'toko' } as any);
      vi.mocked(DokployService.deleteDomain).mockResolvedValue(true);

      const result = await DomainService.removeDomain(siteId, 'butikku.id');
      expect(result.status).toBe('success');
      expect(DokployService.deleteDomain).toHaveBeenCalledWith('butikku.id');
      expect(db.site.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: siteId },
          data: { customDomain: null, customDomainVerified: false },
        })
      );
    });
  });
});

