import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let mercadoPago: any;
  let config: any;

  const PLAN = {
    id: 'plan-1',
    name: 'Player Pass',
    priceCents: 8990,
    active: true,
    maxActiveSubscribers: null,
  };

  const CUSTOMER = { id: 'cust-1', email: 'cliente@teste.com' };

  beforeEach(() => {
    prisma = {
      subscriptionPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      customer: { findUnique: jest.fn(), update: jest.fn() },
      customerSubscription: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    mercadoPago = {
      createPreapprovalForCustomer: jest.fn(),
      cancelPreapproval: jest.fn(),
      updatePreapprovalAmount: jest.fn(),
    };
    config = { get: jest.fn().mockReturnValue('http://localhost:3001') };
    service = new SubscriptionsService(prisma, mercadoPago, config);
  });

  it('listAllSubscriptions inclui plano e cliente, ordenado por criação descendente', async () => {
    prisma.customerSubscription.findMany.mockResolvedValue([]);
    await service.listAllSubscriptions();
    expect(prisma.customerSubscription.findMany).toHaveBeenCalledWith({
      include: { plan: true, customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('createSubscription lança ConflictException quando o cliente já tem assinatura em aberto', async () => {
    prisma.customerSubscription.findFirst.mockResolvedValue({ id: 'sub-existente' });

    await expect(
      service.createSubscription('cust-1', { planId: 'plan-1' }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.subscriptionPlan.findUnique).not.toHaveBeenCalled();
  });

  it('createSubscription lança NotFoundException quando o plano não existe ou está inativo', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue(null);
    await expect(
      service.createSubscription('cust-1', { planId: 'ghost' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('createSubscription lança BadRequestException quando o plano está esgotado', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue({
      ...PLAN,
      maxActiveSubscribers: 10,
    });
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER);
    prisma.customerSubscription.count.mockResolvedValue(10);

    await expect(
      service.createSubscription('cust-1', { planId: 'plan-1' }),
    ).rejects.toThrow(BadRequestException);
    expect(mercadoPago.createPreapprovalForCustomer).not.toHaveBeenCalled();
  });

  it('createSubscription lança BadRequestException quando não há e-mail do cliente', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue(PLAN);
    prisma.customer.findUnique.mockResolvedValue({ ...CUSTOMER, email: null });

    await expect(
      service.createSubscription('cust-1', { planId: 'plan-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createSubscription cria a assinatura pendente e devolve o checkoutUrl', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue(PLAN);
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER);
    prisma.customerSubscription.create.mockResolvedValue({ id: 'sub-1' });
    mercadoPago.createPreapprovalForCustomer.mockResolvedValue({
      id: 'mp-preapproval-1',
      initPoint: 'https://mercadopago.com/checkout/abc',
      status: 'pending',
    });

    const result = await service.createSubscription('cust-1', {
      planId: 'plan-1',
    });

    expect(prisma.customerSubscription.create).toHaveBeenCalledWith({
      data: { customerId: 'cust-1', planId: 'plan-1', status: 'pending' },
    });
    expect(mercadoPago.createPreapprovalForCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        priceCents: 8990,
        payerEmail: 'cliente@teste.com',
        externalReference: 'sub-1',
      }),
    );
    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { mercadoPagoPreapprovalId: 'mp-preapproval-1' },
    });
    expect(result).toEqual({
      subscriptionId: 'sub-1',
      checkoutUrl: 'https://mercadopago.com/checkout/abc',
    });
  });

  it('createSubscription remove a assinatura pendente quando o Mercado Pago falha', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue(PLAN);
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER);
    prisma.customerSubscription.create.mockResolvedValue({ id: 'sub-1' });
    mercadoPago.createPreapprovalForCustomer.mockRejectedValue(
      new Error('Mercado Pago indisponível'),
    );

    await expect(
      service.createSubscription('cust-1', { planId: 'plan-1' }),
    ).rejects.toThrow('Mercado Pago indisponível');

    expect(prisma.customerSubscription.delete).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
    });
  });

  it('cancelSubscription lança NotFoundException quando a assinatura não existe ou é de outro cliente', async () => {
    prisma.customerSubscription.findUnique.mockResolvedValue(null);
    await expect(
      service.cancelSubscription('cust-1', 'ghost'),
    ).rejects.toThrow(NotFoundException);

    prisma.customerSubscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      customerId: 'outro-cliente',
    });
    await expect(
      service.cancelSubscription('cust-1', 'sub-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('cancelSubscription cancela no Mercado Pago e marca como canceled localmente', async () => {
    prisma.customerSubscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      customerId: 'cust-1',
      mercadoPagoPreapprovalId: 'mp-preapproval-1',
    });

    const result = await service.cancelSubscription('cust-1', 'sub-1');

    expect(mercadoPago.cancelPreapproval).toHaveBeenCalledWith(
      'mp-preapproval-1',
    );
    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { status: 'canceled' },
    });
    expect(result).toEqual({ ok: true });
  });

  it('removePlan lança ConflictException quando o plano já tem assinantes', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue(PLAN);
    prisma.customerSubscription.findFirst.mockResolvedValue({ id: 'sub-1' });

    await expect(service.removePlan('plan-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.subscriptionPlan.delete).not.toHaveBeenCalled();
  });

  it('removePlan exclui quando o plano não tem assinantes', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue(PLAN);
    prisma.customerSubscription.findFirst.mockResolvedValue(null);

    await expect(service.removePlan('plan-1')).resolves.toEqual({ ok: true });
    expect(prisma.subscriptionPlan.delete).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
    });
  });

  describe('changePlan', () => {
    const OPEN_SUBSCRIPTION = {
      id: 'sub-1',
      customerId: 'cust-1',
      planId: 'plan-1',
      status: 'active',
      mercadoPagoPreapprovalId: 'mp-preapproval-1',
    };
    const NEW_PLAN = {
      id: 'plan-2',
      name: 'Elite Pass',
      priceCents: 23990,
      active: true,
      includedMinutes: 2400,
      maxActiveSubscribers: null,
    };

    it('lança NotFoundException quando a assinatura não existe, é de outro cliente, ou está cancelada', async () => {
      prisma.customerSubscription.findUnique.mockResolvedValue(null);
      await expect(
        service.changePlan('cust-1', 'ghost', 'plan-2'),
      ).rejects.toThrow(NotFoundException);

      prisma.customerSubscription.findUnique.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        customerId: 'outro-cliente',
      });
      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-2'),
      ).rejects.toThrow(NotFoundException);

      prisma.customerSubscription.findUnique.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        status: 'canceled',
      });
      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-2'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança NotFoundException quando o plano novo não existe ou está inativo', async () => {
      prisma.customerSubscription.findUnique.mockResolvedValue(OPEN_SUBSCRIPTION);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.changePlan('cust-1', 'sub-1', 'ghost'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequestException quando o plano novo é o mesmo que já está', async () => {
      prisma.customerSubscription.findUnique.mockResolvedValue(OPEN_SUBSCRIPTION);
      prisma.subscriptionPlan.findUnique.mockResolvedValue({
        ...NEW_PLAN,
        id: 'plan-1',
      });

      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-1'),
      ).rejects.toThrow(BadRequestException);
      expect(mercadoPago.updatePreapprovalAmount).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando o plano novo está esgotado', async () => {
      prisma.customerSubscription.findUnique.mockResolvedValue(OPEN_SUBSCRIPTION);
      prisma.subscriptionPlan.findUnique.mockResolvedValue({
        ...NEW_PLAN,
        maxActiveSubscribers: 5,
      });
      prisma.customerSubscription.count.mockResolvedValue(5);

      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-2'),
      ).rejects.toThrow(BadRequestException);
      expect(mercadoPago.updatePreapprovalAmount).not.toHaveBeenCalled();
    });

    it('atualiza o valor no Mercado Pago e troca o plano localmente, substituindo os minutos', async () => {
      prisma.customerSubscription.findUnique.mockResolvedValue(OPEN_SUBSCRIPTION);
      prisma.subscriptionPlan.findUnique.mockResolvedValue(NEW_PLAN);
      prisma.customerSubscription.update.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        planId: 'plan-2',
        includedMinutesRemaining: 2400,
      });

      const result = await service.changePlan('cust-1', 'sub-1', 'plan-2');

      expect(mercadoPago.updatePreapprovalAmount).toHaveBeenCalledWith(
        'mp-preapproval-1',
        23990,
      );
      expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          planId: 'plan-2',
          includedMinutesRemaining: 2400,
          planChangedAt: expect.any(Date),
        },
        include: { plan: true },
      });
      expect(result.planId).toBe('plan-2');
    });

    it('lança BadRequestException quando já trocou de plano no ciclo atual', async () => {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 5);
      const changedAt = new Date(now);
      changedAt.setDate(changedAt.getDate() - 1);

      prisma.customerSubscription.findUnique.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        currentPeriodStart: periodStart,
        planChangedAt: changedAt,
      });
      prisma.subscriptionPlan.findUnique.mockResolvedValue(NEW_PLAN);

      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-2'),
      ).rejects.toThrow(BadRequestException);
      expect(mercadoPago.updatePreapprovalAmount).not.toHaveBeenCalled();
    });

    it('permite trocar de plano quando a última troca foi em um ciclo anterior (já renovou)', async () => {
      const periodStart = new Date();
      const changedAt = new Date(periodStart);
      changedAt.setMonth(changedAt.getMonth() - 1);

      prisma.customerSubscription.findUnique.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        currentPeriodStart: periodStart,
        planChangedAt: changedAt,
      });
      prisma.subscriptionPlan.findUnique.mockResolvedValue(NEW_PLAN);
      prisma.customerSubscription.update.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        planId: 'plan-2',
      });

      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-2'),
      ).resolves.toBeDefined();
      expect(mercadoPago.updatePreapprovalAmount).toHaveBeenCalled();
    });

    it('permite trocar de plano quando nunca trocou antes ou a assinatura ainda não tem currentPeriodStart', async () => {
      prisma.customerSubscription.findUnique.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        currentPeriodStart: null,
        planChangedAt: null,
      });
      prisma.subscriptionPlan.findUnique.mockResolvedValue(NEW_PLAN);
      prisma.customerSubscription.update.mockResolvedValue({
        ...OPEN_SUBSCRIPTION,
        planId: 'plan-2',
      });

      await expect(
        service.changePlan('cust-1', 'sub-1', 'plan-2'),
      ).resolves.toBeDefined();
      expect(mercadoPago.updatePreapprovalAmount).toHaveBeenCalled();
    });
  });
});
