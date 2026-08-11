import { NotFoundException } from '@nestjs/common';
import { HourlyRatesService } from './hourly-rates.service';

describe('HourlyRatesService', () => {
  let service: HourlyRatesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      hourlyRate: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new HourlyRatesService(prisma);
  });

  it('listActive filtra por active=true', async () => {
    prisma.hourlyRate.findMany.mockResolvedValue([]);
    await service.listActive();
    expect(prisma.hourlyRate.findMany).toHaveBeenCalledWith({
      where: { active: true },
    });
  });

  it('update lança NotFoundException quando a tarifa não existe', async () => {
    prisma.hourlyRate.findUnique.mockResolvedValue(null);
    await expect(
      service.update('ghost', { label: 'x' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('remove deleta quando a tarifa existe', async () => {
    prisma.hourlyRate.findUnique.mockResolvedValue({ id: 'rate-1' });
    prisma.hourlyRate.delete.mockResolvedValue({});

    await expect(service.remove('rate-1')).resolves.toEqual({ ok: true });
    expect(prisma.hourlyRate.delete).toHaveBeenCalledWith({
      where: { id: 'rate-1' },
    });
  });
});
