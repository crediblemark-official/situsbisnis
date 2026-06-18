import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Page from '@/app/credbuild/[...credbuildPath]/page';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getSiteId, getTenant } from '@/lib/domains/tenant';
import { getPage } from '@/modules/page/ui/content-display';
import { headers } from 'next/headers';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/domains/tenant', () => ({
  getSiteId: vi.fn(),
  getTenant: vi.fn(),
}));

vi.mock('@/modules/page/ui/content-display', () => ({
  getPage: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

// Mock the Client component
vi.mock('@/modules/page/ui/credbuild/CredbuildClient', () => ({
  CredbuildClient: () => null,
}));

describe('CredBuild Page Authentication Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_ROOT_DOMAIN', 'example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should redirect to /login on root domain if user is not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    (getSiteId as any).mockResolvedValue(null);
    (getTenant as any).mockResolvedValue(null);
    (headers as any).mockResolvedValue({
      get: vi.fn((key) => {
        if (key === 'x-url') return '/credbuild';
        if (key === 'host') return 'example.com';
        return null;
      }),
    });

    await Page({ params: Promise.resolve({ credbuildPath: [] }) });

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect to auth bridge on subdomain if user is not authenticated', async () => {
    (getServerSession as any).mockResolvedValue(null);
    (getSiteId as any).mockResolvedValue('site-1');
    (getTenant as any).mockResolvedValue('tenant');
    (headers as any).mockResolvedValue({
      get: vi.fn((key) => {
        if (key === 'x-url') return '/credbuild';
        if (key === 'host') return 'tenant.example.com';
        return null;
      }),
    });

    await Page({ params: Promise.resolve({ credbuildPath: [] }) });

    expect(redirect).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/bridge?target=http%3A%2F%2Ftenant.example.com%2Fcredbuild')
    );
  });

  it('should redirect to /dashboard if user is authenticated but has an unauthorized role', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Standard User', role: 'user' },
    });
    (getSiteId as any).mockResolvedValue('site-1');
    (getTenant as any).mockResolvedValue('tenant');
    (headers as any).mockResolvedValue({
      get: vi.fn((key) => {
        if (key === 'x-url') return '/credbuild';
        if (key === 'host') return 'tenant.example.com';
        return null;
      }),
    });

    await Page({ params: Promise.resolve({ credbuildPath: [] }) });

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should render the editor page successfully if user is authenticated with an authorized role', async () => {
    (getServerSession as any).mockResolvedValue({
      user: { id: 'owner-1', name: 'Site Owner', role: 'owner' },
    });
    (getSiteId as any).mockResolvedValue('site-1');
    (getTenant as any).mockResolvedValue('tenant');
    (headers as any).mockResolvedValue({
      get: vi.fn((key) => {
        if (key === 'x-url') return '/credbuild';
        if (key === 'host') return 'tenant.example.com';
        return null;
      }),
    });
    (getPage as any).mockResolvedValue({
      id: 'page-1',
      path: '/',
      data: {},
    });

    const element = await Page({ params: Promise.resolve({ credbuildPath: [] }) });

    expect(redirect).not.toHaveBeenCalled();
    expect(getPage).toHaveBeenCalledWith('/');
    expect(element).not.toBeNull();
  });
});
