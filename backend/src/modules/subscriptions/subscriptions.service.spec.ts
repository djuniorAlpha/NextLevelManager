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
    mercadoPagoPreapprovalPlanId: 'mp-plan-1',
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
      createPreapprovalPlan: jest.fn(),
      createPreapprovalForCustomer: jest.fn(),
      cancelPreapproval: jest.fn(),
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

    expect(mercadoPago.createPreapprovalPlan).not.toHaveBeenCalled();
    expect(prisma.customerSubscription.create).toHaveBeenCalledWith({
      data: { customerId: 'cust-1', planId: 'plan-1', status: 'pending' },
    });
    expect(mercadoPago.createPreapprovalForCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        preapprovalPlanId: 'mp-plan-1',
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

  it('createSubscription cria o preapproval_plan no Mercado Pago quando o plano ainda não tem um', async () => {
    prisma.subscriptionPlan.findUnique.mockResolvedValue({
      ...PLAN,
      mercadoPagoPreapprovalPlanId: null,
    });
    prisma.customer.findUnique.mockResolvedValue(CUSTOMER);
    mercadoPago.createPreapprovalPlan.mockResolvedValue({ id: 'mp-plan-novo' });
    prisma.customerSubscription.create.mockResolvedValue({ id: 'sub-1' });
    mercadoPago.createPreapprovalForCustomer.mockResolvedValue({
      id: 'mp-preapproval-1',
      initPoint: 'https://mercadopago.com/checkout/abc',
      status: 'pending',
    });

    await service.createSubscription('cust-1', { planId: 'plan-1' });

    expect(mercadoPago.createPreapprovalPlan).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Player Pass', priceCents: 8990 }),
    );
    expect(prisma.subscriptionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { mercadoPagoPreapprovalPlanId: 'mp-plan-novo' },
    });
    expect(mercadoPago.createPreapprovalForCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ preapprovalPlanId: 'mp-plan-novo' }),
    );
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
});
