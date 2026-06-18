import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrderApi as createOrder } from '@/modules/order/controllers/order-api.controller';
import { db } from '@/lib/core/db';
import { validateBody, getApiContext } from '@/lib/api/utils';
import { SubscriptionClient } from '@/modules/subscription';
import { getSiteId } from '@/lib/domains/tenant';
import { getServerSession } from 'next-auth';

vi.mock('@/lib/core/db', () => ({
  db: {
    product: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      update: vi.fn(),
    },
    site: {
      findUnique: vi.fn(),
    },
    paymentSettings: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    platformSettings: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/api/utils', () => ({
  getApiContext: vi.fn(),
  apiResponse: vi.fn((data) => ({ status: 200, json: async () => data })),
  apiError: vi.fn((msg, status) => ({ status: status || 500, json: async () => ({ error: msg }) })),
  validateBody: vi.fn(),
}));

vi.mock('@/lib/domains/tenant', () => ({
  getSiteId: vi.fn(),
}));

vi.mock('@/modules/subscription', () => ({
  SubscriptionClient: {
    checkSiteLimit: vi.fn(),
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

describe('Orders API POST Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(getApiContext).mockResolvedValue({ session: null, siteId: 'site-123' } as any);
    vi.mocked(db.site.findUnique).mockResolvedValue({ name: 'Test Site' } as any);
    vi.mocked(db.paymentSettings.findUnique).mockResolvedValue(null);
    vi.mocked(db.platformSettings.findUnique).mockResolvedValue(null);
  });

  it('should successfully create an order using prices from database and ignore client-supplied prices', async () => {
    // 1. Setup mocks
    vi.mocked(getSiteId).mockResolvedValue('site-123');
    vi.mocked(SubscriptionClient.checkSiteLimit).mockResolvedValue({ allowed: true });
    
    // Client sends price of $1.50 for a $99.99 item (manipulation attempt)
    vi.mocked(validateBody).mockResolvedValue({
      data: {
        items: [
          { productId: 'prod-abc', quantity: 2, price: 1.50 }
        ],
        name: 'John Doe',
        email: 'john@example.com',
        phone: '081234567890',
        address: '123 Main St',
        city: 'Metropolis',
        zip: '12345'
      }
    } as any);

    // Database returns the true product price of $99.99
    vi.mocked(db.product.findMany).mockResolvedValue([
      { id: 'prod-abc', price: 99.99, name: 'Cool Widget', siteId: 'site-123' }
    ] as any);

    // Mock db.order.create
    vi.mocked(db.order.create).mockResolvedValue({
      id: 'order-xyz',
      total: '199.98',
      items: [
        { productId: 'prod-abc', quantity: 2, price: '99.99' }
      ]
    } as any);

    // 2. Execute
    const req = new Request('http://localhost/api/orders', { method: 'POST' });
    const response: any = await createOrder(req);

    // 3. Verify
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe('order-xyz');

    // Verify database was queried for products matching siteId
    expect(db.product.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['prod-abc'] },
        siteId: 'site-123'
      }
    });

    // Verify order was created with the correct (database) price and calculated total
    expect(db.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        total: '199.98', // (99.99 * 2) instead of (1.50 * 2)
        items: {
          create: [
            { productId: 'prod-abc', quantity: 2, price: '99.99' }
          ]
        }
      }),
      include: {
        items: true
      }
    });
  });

  it('should return 400 Bad Request if a product is not found or does not belong to the current siteId', async () => {
    // 1. Setup mocks
    vi.mocked(getSiteId).mockResolvedValue('site-123');
    vi.mocked(SubscriptionClient.checkSiteLimit).mockResolvedValue({ allowed: true });
    
    vi.mocked(validateBody).mockResolvedValue({
      data: {
        items: [
          { productId: 'prod-missing', quantity: 1, price: 10 }
        ],
        email: 'john@example.com'
      }
    } as any);

    // Database returns empty array (product not found or not in site-123)
    vi.mocked(db.product.findMany).mockResolvedValue([]);

    // 2. Execute
    const req = new Request('http://localhost/api/orders', { method: 'POST' });
    const response: any = await createOrder(req);

    // 3. Verify
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Product not found or invalid');
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('should return 403 Forbidden when maxOrders subscription limit is exceeded', async () => {
    // 1. Setup mocks
    vi.mocked(getSiteId).mockResolvedValue('site-123');
    vi.mocked(SubscriptionClient.checkSiteLimit).mockResolvedValue({ allowed: false, message: 'Limit exceeded for maxOrders' });

    // 2. Execute
    const req = new Request('http://localhost/api/orders', { method: 'POST' });
    const response: any = await createOrder(req);

    // 3. Verify
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain('Limit exceeded for maxOrders');
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it('should successfully create a whatsapp order, saving paymentMethod and skipping payment gateway invoice creation', async () => {
    // 1. Setup mocks
    vi.mocked(getSiteId).mockResolvedValue('site-123');
    vi.mocked(SubscriptionClient.checkSiteLimit).mockResolvedValue({ allowed: true });
    
    // Mock valid payment settings so that system checkout would trigger the gateway
    vi.mocked(db.paymentSettings.findUnique).mockResolvedValue({
      gatewayMerchantId: 'merchant-123',
      gatewayApiKey: 'api-key-123',
      gatewaySandbox: true
    } as any);

    vi.mocked(validateBody).mockResolvedValue({
      data: {
        items: [
          { productId: 'prod-abc', quantity: 1, price: 99.99 }
        ],
        name: 'John Doe',
        email: 'john@example.com',
        phone: '081234567890',
        address: '123 Main St',
        city: 'Metropolis',
        zip: '12345',
        paymentMethod: 'whatsapp' // Specify whatsapp checkout
      }
    } as any);

    vi.mocked(db.product.findMany).mockResolvedValue([
      { id: 'prod-abc', price: 99.99, name: 'Cool Widget', siteId: 'site-123' }
    ] as any);

    vi.mocked(db.order.create).mockResolvedValue({
      id: 'order-whatsapp-123',
      total: '99.99',
      items: [
        { productId: 'prod-abc', quantity: 1, price: '99.99' }
      ]
    } as any);

    // 2. Execute
    const req = new Request('http://localhost/api/orders', { method: 'POST' });
    const response: any = await createOrder(req);

    // 3. Verify
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe('order-whatsapp-123');

    // Verify order was created with paymentMethod: 'whatsapp'
    expect(db.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentMethod: 'whatsapp',
        total: '99.99'
      }),
      include: {
        items: true
      }
    });

    // Verify db.order.update was never called (skipping payment gateway invoice)
    expect(db.order.update).not.toHaveBeenCalled();
  });

  it('should successfully create a manual bank transfer order, bypassing Duitku and saving manual bank details in paymentUrl', async () => {
    // 1. Setup mocks
    vi.mocked(getSiteId).mockResolvedValue('site-123');
    vi.mocked(SubscriptionClient.checkSiteLimit).mockResolvedValue({ allowed: true });
    
    // Mock valid payment settings so gateway could be triggered, but we also have bank details
    vi.mocked(db.paymentSettings.findUnique).mockResolvedValue({
      siteId: 'site-123',
      gatewayMerchantId: 'merchant-123',
      gatewayApiKey: 'api-key-123',
      gatewaySandbox: true,
      bankName: 'BCA',
      accountNumber: '123456789',
      accountHolder: 'Jane Doe',
      instructions: 'Transfer manual bank'
    } as any);

    const mockPaymentSettings = {
      siteId: 'site-123',
      gatewayMerchantId: 'merchant-123',
      gatewayApiKey: 'api-key-123',
      gatewaySandbox: true,
      bankName: 'BCA',
      accountNumber: '123456789',
      accountHolder: 'Jane Doe',
      instructions: 'Transfer manual bank'
    };
    vi.mocked(db.paymentSettings.findFirst).mockResolvedValue(mockPaymentSettings as any);

    vi.mocked(validateBody).mockResolvedValue({
      data: {
        items: [
          { productId: 'prod-abc', quantity: 1, price: 99.99 }
        ],
        name: 'John Doe',
        email: 'john@example.com',
        phone: '081234567890',
        address: '123 Main St',
        city: 'Metropolis',
        zip: '12345',
        paymentMethod: 'manual' // Specify manual checkout
      }
    } as any);

    vi.mocked(db.product.findMany).mockResolvedValue([
      { id: 'prod-abc', price: 99.99, name: 'Cool Widget', siteId: 'site-123' }
    ] as any);

    const mockOrder = {
      id: 'order-manual-123',
      total: '99.99',
      items: [
        { productId: 'prod-abc', quantity: 1, price: '99.99' }
      ]
    };
    vi.mocked(db.order.create).mockResolvedValue(mockOrder as any);
    vi.mocked(db.order.update).mockResolvedValue({
      ...mockOrder,
      paymentUrl: 'custom:{"paymentMethod":"manual","bankName":"BCA","accountHolder":"Jane Doe","vaNumber":"123456789","instructions":"Transfer manual bank"}'
    } as any);

    // 2. Execute
    const req = new Request('http://localhost/api/orders', { method: 'POST' });
    const response: any = await createOrder(req);

    // 3. Verify
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.paymentUrl).toContain('custom:');
    expect(body.paymentUrl).toContain('BCA');

    // Verify order update was called with the custom JSON
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: 'order-manual-123' },
      data: expect.objectContaining({
        paymentUrl: expect.stringContaining('custom:')
      }),
      include: {
        items: true
      }
    });
  });
});
