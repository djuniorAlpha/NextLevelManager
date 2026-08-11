import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Machine } from '@prisma/client';
import { MercadoPagoService } from './mercado-pago.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;
  let mercadoPago: { createPixCharge: jest.Mock };
  const machine = { id: 'machine-1' } as Machine;

  beforeEach(() => {
    prisma = {
      timePackage: { findUnique: jest.fn() },
      hourlyRate: { findUnique: jest.fn() },
      payment: { create: jest.fn(), findUnique: jest.fn() },
    };
    mercadoPago = {
      createPixCharge: jest.fn().mockResolvedValue({
        externalPaymentId: 'mp-1',
        qrCodeBase64: 'base64',
        qrCodeText: 'qr-text',
      }),
    };
    service = new PaymentsService(
      prisma,
      mercadoPago as unknown as MercadoPagoService,
    );
  });

  it('rejeita quando nem timePackageId nem hourlyRateId são informados', async () => {
    await expect(service.createPixForMachine(machine, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita quando timePackageId e hourlyRateId são informados juntos', async () => {
    await expect(
      service.createPixForMachine(machine, {
        timePackageId: 'pkg-1',
        hourlyRateId: 'rate-1',
        minutes: 60,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita hourlyRateId sem minutes', async () => {
    await expect(
      service.createPixForMachine(machine, { hourlyRateId: 'rate-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lança NotFoundException quando o pacote não existe ou está inativo', async () => {
    prisma.timePackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      active: false,
    });
    await expect(
      service.createPixForMachine(machine, { timePackageId: 'pkg-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('cria o pagamento a partir de um TimePackage válido', async () => {
    prisma.timePackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      active: true,
      priceCents: 500,
    });
    prisma.payment.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'payment-1', ...data }),
    );

    const result = await service.createPixForMachine(machine, {
      timePackageId: 'pkg-1',
    });

    expect(mercadoPago.createPixCharge).toHaveBeenCalledWith(
      500,
      expect.any(String),
    );
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        machineId: 'machine-1',
        purpose: 'package_purchase',
        amountCents: 500,
        timePackageId: 'pkg-1',
        externalPaymentId: 'mp-1',
      }),
    });
    expect(result.paymentId).toBe('payment-1');
  });

  it('calcula o valor proporcional ao tempo para HourlyRate', async () => {
    prisma.hourlyRate.findUnique.mockResolvedValue({
      id: 'rate-1',
      active: true,
      ratePerHourCents: 1000,
    });
    prisma.payment.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'payment-2', ...data }),
    );

    await service.createPixForMachine(machine, {
      hourlyRateId: 'rate-1',
      minutes: 30,
    });

    expect(mercadoPago.createPixCharge).toHaveBeenCalledWith(
      500,
      expect.any(String),
    );
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purpose: 'hourly_purchase',
        amountCents: 500,
      }),
    });
  });

  describe('getPaymentForMachine', () => {
    it('lança NotFoundException quando o pagamento não existe', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      await expect(
        service.getPaymentForMachine(machine, 'ghost'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança NotFoundException quando o pagamento pertence a outra estação', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        machineId: 'other-machine',
      });
      await expect(
        service.getPaymentForMachine(machine, 'payment-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('devolve o pagamento quando pertence à estação', async () => {
      const payment = { id: 'payment-1', machineId: 'machine-1' };
      prisma.payment.findUnique.mockResolvedValue(payment);
      await expect(
        service.getPaymentForMachine(machine, 'payment-1'),
      ).resolves.toEqual(payment);
    });
  });
});
