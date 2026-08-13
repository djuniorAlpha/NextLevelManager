import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Machine } from '@prisma/client';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: any;

  const MACHINE = { id: 'machine-1' } as Machine;

  let tx: any;

  beforeEach(() => {
    tx = {
      session: { update: jest.fn() },
      customer: { update: jest.fn() },
      customerSubscription: { findFirst: jest.fn(), update: jest.fn() },
    };
    prisma = {
      customer: { findUnique: jest.fn() },
      customerSubscription: { findFirst: jest.fn().mockResolvedValue(null) },
      session: { create: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn((callback) => callback(tx)),
    };
    service = new SessionsService(prisma);
  });

  it('lança NotFoundException quando o cliente não existe', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(
      service.startForCustomer(MACHINE, 'ghost'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('lança BadRequestException quando não há assinatura ativa com minutos e o saldo é insuficiente', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      balanceMinutes: 0,
    });

    await expect(
      service.startForCustomer(MACHINE, 'cust-1'),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.session.create).not.toHaveBeenCalled();
  });

  it('prioriza a assinatura ativa com minutos inclusos sobre o saldo', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      balanceMinutes: 90,
    });
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      includedMinutesRemaining: 40,
    });
    prisma.session.create.mockResolvedValue({
      id: 'session-1',
      allocatedSeconds: 2400,
      source: 'subscription',
    });

    const result = await service.startForCustomer(MACHINE, 'cust-1');

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        machineId: 'machine-1',
        customerId: 'cust-1',
        source: 'subscription',
        allocatedSeconds: 2400,
      },
    });
    expect(result).toEqual({
      sessionId: 'session-1',
      allocatedSeconds: 2400,
      source: 'subscription',
    });
  });

  it('cai pro saldo quando a assinatura ativa não tem minutos inclusos restantes', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      balanceMinutes: 90,
    });
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      includedMinutesRemaining: 0,
    });
    prisma.session.create.mockResolvedValue({
      id: 'session-1',
      allocatedSeconds: 5400,
      source: 'customer_balance',
    });

    const result = await service.startForCustomer(MACHINE, 'cust-1');

    expect(result.source).toBe('customer_balance');
  });

  it('cria a sessão alocando o saldo inteiro em segundos, sem descontar o saldo', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      balanceMinutes: 90,
    });
    prisma.session.create.mockResolvedValue({
      id: 'session-1',
      allocatedSeconds: 5400,
      source: 'customer_balance',
    });

    const result = await service.startForCustomer(MACHINE, 'cust-1');

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        machineId: 'machine-1',
        customerId: 'cust-1',
        source: 'customer_balance',
        allocatedSeconds: 5400,
      },
    });
    expect(result).toEqual({
      sessionId: 'session-1',
      allocatedSeconds: 5400,
      source: 'customer_balance',
    });
  });

  it('endSession lança NotFoundException quando a sessão não existe ou é de outra máquina', async () => {
    prisma.session.findUnique.mockResolvedValue(null);
    await expect(
      service.endSession(MACHINE, 'ghost', 100),
    ).rejects.toThrow(NotFoundException);

    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      machineId: 'outra-máquina',
    });
    await expect(
      service.endSession(MACHINE, 'session-1', 100),
    ).rejects.toThrow(NotFoundException);

    expect(tx.session.update).not.toHaveBeenCalled();
  });

  it('endSession é idempotente quando a sessão já foi encerrada', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      machineId: 'machine-1',
      endedAt: new Date(),
    });

    const result = await service.endSession(MACHINE, 'session-1', 100);

    expect(result).toEqual({ ok: true });
    expect(tx.session.update).not.toHaveBeenCalled();
    expect(tx.customer.update).not.toHaveBeenCalled();
  });

  it('endSession desconta o saldo arredondando pra cima ao minuto, limitado ao alocado', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      machineId: 'machine-1',
      customerId: 'cust-1',
      allocatedSeconds: 5400,
      endedAt: null,
    });

    const result = await service.endSession(MACHINE, 'session-1', 125);

    expect(tx.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { consumedSeconds: 125, endedAt: expect.any(Date) },
    });
    expect(tx.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { balanceMinutes: { decrement: 3 } },
    });
    expect(result).toEqual({ ok: true });
  });

  it('endSession limita o consumo reportado ao tempo alocado e não desconta sessão sem cliente', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      machineId: 'machine-1',
      customerId: null,
      allocatedSeconds: 300,
      endedAt: null,
    });

    await service.endSession(MACHINE, 'session-1', 999999);

    expect(tx.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: { consumedSeconds: 300, endedAt: expect.any(Date) },
    });
    expect(tx.customer.update).not.toHaveBeenCalled();
  });

  it('endSession decrementa includedMinutesRemaining quando a sessão veio de assinatura', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      machineId: 'machine-1',
      customerId: 'cust-1',
      source: 'subscription',
      allocatedSeconds: 2400,
      endedAt: null,
    });
    tx.customerSubscription.findFirst.mockResolvedValue({ id: 'sub-1' });

    await service.endSession(MACHINE, 'session-1', 125);

    expect(tx.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { includedMinutesRemaining: { decrement: 3 } },
    });
    expect(tx.customer.update).not.toHaveBeenCalled();
  });
});
