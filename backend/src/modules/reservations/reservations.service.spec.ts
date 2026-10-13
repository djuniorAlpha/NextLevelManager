import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: any;
  let config: any;

  beforeEach(() => {
    prisma = {
      reservation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    config = { get: jest.fn() };
    service = new ReservationsService(prisma, config);
  });

  const baseDto = {
    type: 'pc' as const,
    customerId: 'customer-1',
    startAt: '2026-10-10T10:00:00.000Z',
    durationMinutes: 60,
  };

  it('create lança BadRequestException quando não informa cliente nem visitante', async () => {
    await expect(
      service.create({ ...baseDto, customerId: undefined }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('create lança BadRequestException quando informa cliente E visitante', async () => {
    await expect(
      service.create({ ...baseDto, guestName: 'Fulano' }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('create lança ConflictException quando a capacidade do tipo já está lotada', async () => {
    config.get.mockReturnValue('1');
    prisma.reservation.count.mockResolvedValue(1);

    await expect(service.create(baseDto, 'admin-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('create passa quando há capacidade livre, calculando endAt a partir da duração', async () => {
    config.get.mockReturnValue('2');
    prisma.reservation.count.mockResolvedValue(1);
    prisma.reservation.create.mockResolvedValue({ id: 'res-1' });

    await service.create(baseDto, 'admin-1');

    expect(prisma.reservation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'pc',
        customerId: 'customer-1',
        durationMinutes: 60,
        endAt: new Date('2026-10-10T11:00:00.000Z'),
        status: 'confirmed',
        createdByAdminId: 'admin-1',
      }),
      include: { customer: true },
    });
  });

  it('update lança NotFoundException quando a reserva não existe', async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);
    await expect(
      service.update('ghost', { durationMinutes: 30 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('remove deleta quando a reserva existe', async () => {
    prisma.reservation.findUnique.mockResolvedValue({ id: 'res-1' });
    prisma.reservation.delete.mockResolvedValue({});

    await expect(service.remove('res-1')).resolves.toEqual({ ok: true });
    expect(prisma.reservation.delete).toHaveBeenCalledWith({
      where: { id: 'res-1' },
    });
  });
});
