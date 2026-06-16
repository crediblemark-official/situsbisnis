import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyDomainConfig } from '@/lib/domains/verification';
import dns from 'dns/promises';

vi.mock('dns/promises', () => ({
  default: {
    resolveCname: vi.fn(),
    resolve4: vi.fn(),
  },
}));

describe('lib/domain-verification.ts', () => {
  const domain = 'test.mycustomdomain.com';
  const rootDomain = 'example.com';
  const serverIp = '1.2.3.4';

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof vi.stubEnv === 'function') {
      vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', rootDomain);
      vi.stubEnv('NEXT_PUBLIC_SERVER_IP', serverIp);
    } else {
      process.env.NEXT_PUBLIC_ROOT_DOMAIN = rootDomain;
      process.env.NEXT_PUBLIC_SERVER_IP = serverIp;
    }
  });

  afterEach(() => {
    if (typeof vi.unstubAllEnvs === 'function') {
      vi.unstubAllEnvs();
    }
  });

  it('should return valid if CNAME matches', async () => {
    (dns.resolveCname as any).mockResolvedValue([`cname.${rootDomain}`]);

    const result = await verifyDomainConfig(domain);
    expect(result.valid).toBe(true);
    expect(result.cname).toBe(true);
  });

  it('should return valid if A record matches', async () => {
    (dns.resolveCname as any).mockRejectedValue(new Error('No CNAME'));
    (dns.resolve4 as any).mockResolvedValue([serverIp]);

    const result = await verifyDomainConfig(domain);
    expect(result.valid).toBe(true);
    expect(result.aRecord).toBe(true);
  });

  it('should return invalid if neither CNAME nor A record matches', async () => {
    (dns.resolveCname as any).mockResolvedValue(['wrong.cname.com']);
    // Mock resolve4 for both the domain and the expected CNAME target
    (dns.resolve4 as any).mockImplementation((d: string) => {
      if (d === domain) return Promise.resolve(['9.9.9.9']);
      if (d === `cname.${rootDomain}`) return Promise.resolve(['1.1.1.1']);
      return Promise.resolve([]);
    });

    const result = await verifyDomainConfig(domain);
    expect(result.valid).toBe(false);
    expect(result.cname).toBe(false);
    expect(result.aRecord).toBe(false);
  });

  it('should return invalid if resolution fails entirely', async () => {
    (dns.resolveCname as any).mockRejectedValue(new Error('DNS Error'));
    (dns.resolve4 as any).mockRejectedValue(new Error('DNS Error'));

    const result = await verifyDomainConfig(domain);
    expect(result.valid).toBe(false);
  });
});
