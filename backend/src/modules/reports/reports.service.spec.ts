import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      payment: {
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    service = new ReportsService(prisma);
  });

  it('lança BadRequestException quando "from" é depois de "to"', async () => {
    await expect(
      service.getFinancialReport({ from: '2026-08-10', to: '2026-08-01' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.payment.aggregate).not.toHaveBeenCalled();
  });

  it('calcula o total, o ticket médio e os breakdowns por método e por tipo', async () => {
    prisma.payment.aggregate.mockResolvedValue({
      _sum: { amountCents: 3000 },
      _count: 3,
    });
    prisma.payment.groupBy.mockImplementation(({ by }: { by: string[] }) => {
      if (by[0] === 'method') {
        return Promise.resolve([
          { method: 'cash', _sum: { amountCents: 2000 }, _count: 2 },
          { method: 'pix', _sum: { amountCents: 1000 }, _count: 1 },
        ]);
      }
      return Promise.resolve([
        { purpose: 'product_sale', _sum: { amountCents: 3000 }, _count: 3 },
      ]);
    });

    const result = await service.getFinancialReport({
      from: '2026-08-01',
      to: '2026-08-13',
    });

    expect(result.totalCents).toBe(3000);
    expect(result.paymentCount).toBe(3);
    expect(result.averageTicketCents).toBe(1000);
    expect(result.byMethod).toEqual([
      { method: 'cash', totalCents: 2000, count: 2 },
      { method: 'pix', totalCents: 1000, count: 1 },
    ]);
    expect(result.byPurpose).toEqual([
      { purpose: 'product_sale', totalCents: 3000, count: 3 },
    ]);

    const where = prisma.payment.aggregate.mock.calls[0][0].where;
    expect(where.status).toBe('approved');
    expect(where.paidAt.gte.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(where.paidAt.lt.toISOString()).toBe('2026-08-14T00:00:00.000Z');
  });

  it('retorna zeros quando não há pagamentos no período', async () => {
    prisma.payment.aggregate.mockResolvedValue({
      _sum: { amountCents: null },
      _count: 0,
    });
    prisma.payment.groupBy.mockResolvedValue([]);

    const result = await service.getFinancialReport({
      from: '2026-08-01',
      to: '2026-08-13',
    });

    expect(result.totalCents).toBe(0);
    expect(result.paymentCount).toBe(0);
    expect(result.averageTicketCents).toBe(0);
    expect(result.byMethod).toEqual([]);
    expect(result.byPurpose).toEqual([]);
  });
});
