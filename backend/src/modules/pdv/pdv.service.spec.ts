import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PdvService } from './pdv.service';

describe('PdvService', () => {
  let service: PdvService;
  let prisma: any;
  let tx: any;

  const COLA = { id: 'prod-1', name: 'Coca-Cola lata', priceCents: 600, active: true };
  const CHIPS = { id: 'prod-2', name: 'Salgadinho', priceCents: 800, active: true };

  beforeEach(() => {
    tx = {
      product: { findMany: jest.fn() },
      customer: { findUnique: jest.fn() },
      customerSubscription: { findFirst: jest.fn() },
      payment: { create: jest.fn() },
      productSale: { create: jest.fn() },
    };
    prisma = {
      productSale: { findMany: jest.fn() },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    service = new PdvService(prisma);
  });

  it('listSales ordena por criação descendente', async () => {
    prisma.productSale.findMany.mockResolvedValue([]);
    await service.listSales();
    expect(prisma.productSale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('createSale calcula o total, cria o pagamento e a venda', async () => {
    tx.product.findMany.mockResolvedValue([COLA, CHIPS]);
    tx.payment.create.mockResolvedValue({ id: 'pay-1' });
    tx.productSale.create.mockResolvedValue({ id: 'sale-1', totalCents: 2000 });

    const dto = {
      items: [
        { productId: COLA.id, quantity: 2 },
        { productId: CHIPS.id, quantity: 1 },
      ],
      method: 'cash' as const,
    };

    const result = await service.createSale(dto, 'admin-1');

    expect(tx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purpose: 'product_sale',
          provider: 'manual',
          status: 'approved',
          amountCents: 2000,
          registeredByAdminId: 'admin-1',
        }),
      }),
    );
    expect(tx.productSale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          paymentId: 'pay-1',
          totalCents: 2000,
        }),
      }),
    );
    expect(result.id).toBe('sale-1');
  });

  it('createSale lança NotFoundException quando um produto não existe', async () => {
    tx.product.findMany.mockResolvedValue([COLA]);

    await expect(
      service.createSale(
        { items: [{ productId: 'ghost', quantity: 1 }], method: 'cash' as const },
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it('createSale lança BadRequestException quando o produto está inativo', async () => {
    tx.product.findMany.mockResolvedValue([{ ...COLA, active: false }]);

    await expect(
      service.createSale(
        { items: [{ productId: COLA.id, quantity: 1 }], method: 'cash' as const },
        'admin-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('createSale lança NotFoundException quando o cliente informado não existe', async () => {
    tx.product.findMany.mockResolvedValue([COLA]);
    tx.customer.findUnique.mockResolvedValue(null);

    await expect(
      service.createSale(
        {
          items: [{ productId: COLA.id, quantity: 1 }],
          method: 'cash' as const,
          customerId: 'ghost-customer',
        },
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it('createSale aplica o desconto de PDV da assinatura ativa do cliente', async () => {
    tx.product.findMany.mockResolvedValue([COLA, CHIPS]);
    tx.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    tx.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      plan: { pdvDiscountPercent: 10 },
    });
    tx.payment.create.mockResolvedValue({ id: 'pay-1' });
    tx.productSale.create.mockResolvedValue({ id: 'sale-1' });

    await service.createSale(
      {
        items: [
          { productId: COLA.id, quantity: 2 },
          { productId: CHIPS.id, quantity: 1 },
        ],
        method: 'cash' as const,
        customerId: 'cust-1',
      },
      'admin-1',
    );

    // Coca-Cola: 600 -> 540 (10% off); Salgadinho: 800 -> 720. Total: 540*2 + 720 = 1800.
    expect(tx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amountCents: 1800 }) }),
    );
    expect(tx.productSale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalCents: 1800,
          items: {
            create: [
              {
                productId: COLA.id,
                quantity: 2,
                unitPriceCents: 540,
                discountPercentApplied: 10,
              },
              {
                productId: CHIPS.id,
                quantity: 1,
                unitPriceCents: 720,
                discountPercentApplied: 10,
              },
            ],
          },
        }),
      }),
    );
  });

  it('createSale não aplica desconto quando o cliente não tem assinatura ativa com desconto de PDV', async () => {
    tx.product.findMany.mockResolvedValue([COLA]);
    tx.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    tx.customerSubscription.findFirst.mockResolvedValue(null);
    tx.payment.create.mockResolvedValue({ id: 'pay-1' });
    tx.productSale.create.mockResolvedValue({ id: 'sale-1' });

    await service.createSale(
      {
        items: [{ productId: COLA.id, quantity: 1 }],
        method: 'cash' as const,
        customerId: 'cust-1',
      },
      'admin-1',
    );

    expect(tx.productSale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              {
                productId: COLA.id,
                quantity: 1,
                unitPriceCents: 600,
                discountPercentApplied: null,
              },
            ],
          },
        }),
      }),
    );
  });
});
