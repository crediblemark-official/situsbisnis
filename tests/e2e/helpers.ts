import { test as base } from '@playwright/test';
import type { Page, APIRequestContext } from '@playwright/test';

let uidCounter = 0;
export const uniqueIp = () => `10.0.${(uidCounter++ % 200) + 1}.${Math.floor(Math.random() * 200) + 10}`;
export const ipHeaders = () => ({ 'x-forwarded-for': uniqueIp() });

export const TENANT_HEADERS = () => ({ ...ipHeaders(), 'x-tenant-subdomain': 'demo1' });

type Auth = { email: string; password: string };

export async function loginViaApi(request: APIRequestContext, credentials?: Auth) {
  const email = credentials?.email || process.env.E2E_TEST_EMAIL || '';
  const password = credentials?.password || process.env.E2E_TEST_PASSWORD || '';
  if (!email || !password) return null;

  const res = await request.post('/api/auth/callback/credentials', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: new URLSearchParams({ email, password, csrfToken: 'dummy' }).toString(),
  });
  const setCookie = res.headers()['set-cookie'];
  return setCookie ? `next-auth.session-token=${setCookie.match(/next-auth\.session-token=([^;]+)/)?.[1] || ''}` : null;
}

export async function getAuthCookies(page: Page, credentials?: Auth) {
  const email = credentials?.email || process.env.E2E_TEST_EMAIL || '';
  const password = credentials?.password || process.env.E2E_TEST_PASSWORD || '';
  if (!email || !password) return [];

  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/sites/, { timeout: 15000 });
  return page.context().cookies();
}

export const allowedStatuses = (...codes: number[]) => (res: { status: () => number }) =>
  codes.includes(res.status());

export const okOr = (...codes: number[]) => (res: { status: () => number; ok: () => boolean }) =>
  res.ok() || codes.includes(res.status());

type TestFixtures = {
  authCookie: string | null;
  tenantRequest: (_request: APIRequestContext) => { headers: Record<string, string> };
};

export const test = base.extend<TestFixtures>({
  authCookie: [async ({ browser }, use) => {
    const email = process.env.E2E_TEST_EMAIL || '';
    const password = process.env.E2E_TEST_PASSWORD || '';
    if (!email || !password) { await use(null); return; }
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/sites/, { timeout: 15000 });
    const cookies = await ctx.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('next-auth.session-token'));
    await ctx.close();
    await use(sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : null);
  }, { scope: 'test' }],
  tenantRequest: [async ({ }, use) => {
    await use((_request: APIRequestContext) => ({
      headers: { ...ipHeaders(), 'x-tenant-subdomain': 'demo1' },
    }));
  }, { scope: 'test' }],
});

export const expect = base.expect;
