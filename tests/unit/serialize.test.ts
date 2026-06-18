import { describe, it, expect } from 'vitest';
import { serializeProduct, serializeProducts, serializeOrder, serializeTransaction, serializeTransactions } from '@/lib/content/serialize';

// Mock Prisma types
const mockProduct = {
  id: 'test-id',
  name: 'Test Product',
  slug: 'test-product',
  description: 'Test description',
  price: { toString: () => '99.99' } as any,
  currency: 'USD',
  images: ['image1.jpg'],
  stock: 10,
  siteId: 'site-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  isArchived: false,
};

const mockOrder = {
  id: 'order-1',
  customerName: 'John Doe',
  customerEmail: 'john@test.com',
  customerAddress: '123 Test St',
  total: { toString: () => '149.99' } as any,
  status: 'pending',
  siteId: 'site-1',
  createdAt: new Date('2024-01-01'),
  paymentStatus: 'pending',
  fulfillmentStatus: 'unfulfilled',
  items: [
    { 
      id: 'item-1', 
      orderId: 'order-1', 
      productId: 'prod-1', 
      quantity: 2, 
      price: { toString: () => '49.99' } as any 
    }
  ],
};

const mockTransaction = {
  id: 'tx-123',
  siteId: 'site-1',
  amount: { toString: () => '50000' } as any,
  status: 'pending',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

describe('lib/serialize.ts', () => {
  describe('serializeProduct', () => {
    it('should serialize a single product', () => {
      const result = serializeProduct(mockProduct as any);
      
      // Should have converted price to string
      expect(result.price).toBe('99.99');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should return null for null input', () => {
      const result = serializeProduct(null);
      expect(result).toBeNull();
    });

    it('should handle missing dates', () => {
      const product = { ...mockProduct, createdAt: null, updatedAt: null } as any;
      const result = serializeProduct(product);
      
      expect(result).toBeDefined();
    });
  });

  describe('serializeProducts', () => {
    it('should serialize array of products', () => {
      const products = [mockProduct, mockProduct] as any;
      const result = serializeProducts(products);
      
      expect(result).toHaveLength(2);
      expect(result[0].price).toBe('99.99');
    });

    it('should return empty array for empty input', () => {
      const result = serializeProducts([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('serializeOrder', () => {
    it('should serialize order with items', () => {
      const result = serializeOrder(mockOrder as any);
      
      expect(result.total).toBe('149.99');
      expect(result.items).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items?.[0].price).toBe('49.99');
    });

    it('should return null for null input', () => {
      const result = serializeOrder(null);
      expect(result).toBeNull();
    });

    it('should handle order without items', () => {
      const orderWithoutItems = { ...mockOrder, items: undefined } as any;
      const result = serializeOrder(orderWithoutItems);
      
      expect(result).toBeDefined();
      expect(result?.items).toBeUndefined();
    });
  });

  describe('serializeTransaction', () => {
    it('should serialize a single transaction', () => {
      const result = serializeTransaction(mockTransaction as any);
      
      expect(result?.amount).toBe(50000);
      expect(result?.createdAt).toBe(new Date('2024-01-01').toISOString());
    });

    it('should return null for null input', () => {
      const result = serializeTransaction(null);
      expect(result).toBeNull();
    });
  });

  describe('serializeTransactions', () => {
    it('should serialize array of transactions', () => {
      const result = serializeTransactions([mockTransaction, mockTransaction]);
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(50000);
    });
  });
});