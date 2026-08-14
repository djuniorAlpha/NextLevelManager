import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { MercadoPagoService } from '../payments/mercado-pago.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WebhooksService } from './webhooks.service';

function signedHeaders(
  secret: string,
  dataId: string,
  requestId = 'req-1',
  ts = '1700000000',
) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', secret).update(manifest).digest('hex');
  return { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId };
}

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: any;
  let config: { get: jest.Mock };
  let mercadoPago: {
    getPaymentStatus: jest.Mock;
    getPreapproval: jest.Mock;
    getInvoice: jest.Mock;
  };
  let realtime: { emitPaymentConfirmed: jest.Mock };

  const secret = 'whsec-test';

  beforeEach(() => {
    prisma = {
      payment: { findFirst: jest.fn(), update: jest.fn() },
      timePackage: { findUnique: jest.fn() },
      hourlyRate: { findUnique: jest.fn() },
      session: { create: jest.fn() },
      customerSubscription: { findFirst: jest.fn(), update: jest.fn() },
      subscriptionPlan: { findUnique: jest.fn() },
    };
    config = { get: jest.fn().mockReturnValue(secret) };
    mercadoPago = {
      getPaymentStatus: jest.fn(),
      getPreapproval: jest.fn(),
      getInvoice: jest.fn(),
    };
    realtime = { emitPaymentConfirmed: jest.fn() };

    service = new WebhooksService(
      prisma,
      config as unknown as ConfigService,
      mercadoPago as unknown as MercadoPagoService,
      realtime as unknown as RealtimeGateway,
    );
  });

  it('rejeita quando a assinatura é inválida', async () => {
    await expect(
      service.handleMercadoPago(
        { 'x-signature': 'ts=123,v1=lixo', 'x-request-id': 'req-1' },
        { data: { id: '999' } },
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('ignora quando a assinatura é válida mas não há data.id', async () => {
    const headers = signedHeaders(secret, 'undefined');
    await expect(service.handleMercadoPago(headers, {})).resolves.toEqual({
      ok: true,
    });
  });

  it('ignora quando o pagamento não é conhecido localmente', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    const headers = signedHeaders(secret, '999');

    await expect(
      service.handleMercadoPago(headers, { data: { id: '999' } }),
    ).resolves.toEqual({ ok: true });
    expect(mercadoPago.getPaymentStatus).not.toHaveBeenCalled();
  });

  it('é idempotente para pagamentos já aprovados', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-1',
      status: 'approved',
    });
    const headers = signedHeaders(secret, '999');

    await service.handleMercadoPago(headers, { data: { id: '999' } });

    expect(mercadoPago.getPaymentStatus).not.toHaveBeenCalled();
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('aprova o pagamento, cria a Session e emite payment.confirmed', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-1',
      status: 'pending',
      machineId: 'machine-1',
      timePackageId: 'pkg-1',
      hourlyRateId: null,
      amountCents: 500,
    });
    mercadoPago.getPaymentStatus.mockResolvedValue('approved');
    prisma.payment.update.mockResolvedValue({
      id: 'payment-1',
      status: 'approved',
      machineId: 'machine-1',
      timePackageId: 'pkg-1',
      hourlyRateId: null,
      amountCents: 500,
    });
    prisma.timePackage.findUnique.mockResolvedValue({
      id: 'pkg-1',
      minutes: 60,
    });

    const headers = signedHeaders(secret, '999');
    await service.handleMercadoPago(headers, { data: { id: '999' } });

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        machineId: 'machine-1',
        paymentId: 'payment-1',
        source: 'pix_guest',
        allocatedSeconds: 3600,
      },
    });
    expect(realtime.emitPaymentConfirmed).toHaveBeenCalledWith(
      'machine-1',
      'payment-1',
    );
  });

  it('calcula allocatedSeconds proporcional ao valor pago para HourlyRate', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-2',
      status: 'pending',
      machineId: 'machine-1',
      timePackageId: null,
      hourlyRateId: 'rate-1',
      amountCents: 500,
    });
    mercadoPago.getPaymentStatus.mockResolvedValue('approved');
    prisma.payment.update.mockResolvedValue({
      id: 'payment-2',
      status: 'approved',
      machineId: 'machine-1',
      timePackageId: null,
      hourlyRateId: 'rate-1',
      amountCents: 500,
    });
    prisma.hourlyRate.findUnique.mockResolvedValue({
      id: 'rate-1',
      ratePerHourCents: 1000,
    });

    const headers = signedHeaders(secret, '999');
    await service.handleMercadoPago(headers, { data: { id: '999' } });

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: {
        machineId: 'machine-1',
        paymentId: 'payment-2',
        source: 'pix_guest',
        allocatedSeconds: 1800,
      },
    });
  });

  it('não cria Session quando o pagamento é rejeitado', async () => {
    prisma.payment.findFirst.mockResolvedValue({
      id: 'payment-3',
      status: 'pending',
      machineId: 'machine-1',
      timePackageId: 'pkg-1',
      hourlyRateId: null,
      amountCents: 500,
    });
    mercadoPago.getPaymentStatus.mockResolvedValue('rejected');
    prisma.payment.update.mockResolvedValue({
      id: 'payment-3',
      status: 'rejected',
      machineId: 'machine-1',
    });

    const headers = signedHeaders(secret, '999');
    await service.handleMercadoPago(headers, { data: { id: '999' } });

    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(realtime.emitPaymentConfirmed).not.toHaveBeenCalled();
  });

  it('pula a validação de assinatura quando o secret não está configurado', async () => {
    config.get.mockReturnValue(undefined);
    prisma.payment.findFirst.mockResolvedValue(null);

    await expect(
      service.handleMercadoPago({}, { data: { id: '999' } }),
    ).resolves.toEqual({ ok: true });
  });

  it('ignora notificação de assinatura quando não há CustomerSubscription correspondente', async () => {
    prisma.customerSubscription.findFirst.mockResolvedValue(null);
    const headers = signedHeaders(secret, 'mp-preapproval-1');

    await service.handleMercadoPago(headers, {
      type: 'subscription_preapproval',
      data: { id: 'mp-preapproval-1' },
    });

    expect(mercadoPago.getPreapproval).not.toHaveBeenCalled();
  });

  it('ativa a assinatura, preenche minutos inclusos e período ao autorizar pela primeira vez', async () => {
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'pending',
    });
    mercadoPago.getPreapproval.mockResolvedValue({ status: 'authorized' });
    prisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      includedMinutes: 600,
    });

    const headers = signedHeaders(secret, 'mp-preapproval-1');
    await service.handleMercadoPago(headers, {
      type: 'subscription_preapproval',
      data: { id: 'mp-preapproval-1' },
    });

    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        status: 'active',
        includedMinutesRemaining: 600,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
      },
    });
  });

  it('marca a assinatura como canceled quando cancelada/pausada no Mercado Pago', async () => {
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'active',
    });
    mercadoPago.getPreapproval.mockResolvedValue({ status: 'cancelled' });

    const headers = signedHeaders(secret, 'mp-preapproval-1');
    await service.handleMercadoPago(headers, {
      type: 'subscription_preapproval',
      data: { id: 'mp-preapproval-1' },
    });

    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { status: 'canceled' },
    });
    expect(prisma.subscriptionPlan.findUnique).not.toHaveBeenCalled();
  });

  it('não repreenche minutos/período quando a assinatura já estava ativa', async () => {
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'active',
    });
    mercadoPago.getPreapproval.mockResolvedValue({ status: 'authorized' });

    const headers = signedHeaders(secret, 'mp-preapproval-1');
    await service.handleMercadoPago(headers, {
      type: 'subscription_preapproval',
      data: { id: 'mp-preapproval-1' },
    });

    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { status: 'active' },
    });
  });

  it('ignora cobrança recorrente quando o invoice não tem preapproval_id', async () => {
    mercadoPago.getInvoice.mockResolvedValue({
      paymentStatus: 'approved',
      preapprovalId: undefined,
    });
    const headers = signedHeaders(secret, 'invoice-1');

    await service.handleMercadoPago(headers, {
      type: 'subscription_authorized_payment',
      data: { id: 'invoice-1' },
    });

    expect(prisma.customerSubscription.findFirst).not.toHaveBeenCalled();
  });

  it('ignora cobrança recorrente quando não há CustomerSubscription correspondente', async () => {
    mercadoPago.getInvoice.mockResolvedValue({
      paymentStatus: 'approved',
      preapprovalId: 'mp-preapproval-1',
    });
    prisma.customerSubscription.findFirst.mockResolvedValue(null);
    const headers = signedHeaders(secret, 'invoice-1');

    await service.handleMercadoPago(headers, {
      type: 'subscription_authorized_payment',
      data: { id: 'invoice-1' },
    });

    expect(prisma.customerSubscription.update).not.toHaveBeenCalled();
  });

  it('ignora cobrança recorrente quando a assinatura já está canceled', async () => {
    mercadoPago.getInvoice.mockResolvedValue({
      paymentStatus: 'approved',
      preapprovalId: 'mp-preapproval-1',
    });
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'canceled',
    });
    const headers = signedHeaders(secret, 'invoice-1');

    await service.handleMercadoPago(headers, {
      type: 'subscription_authorized_payment',
      data: { id: 'invoice-1' },
    });

    expect(prisma.customerSubscription.update).not.toHaveBeenCalled();
  });

  it('renova a assinatura ao aprovar a cobrança recorrente, substituindo os minutos e avançando o período', async () => {
    mercadoPago.getInvoice.mockResolvedValue({
      paymentStatus: 'approved',
      preapprovalId: 'mp-preapproval-1',
    });
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'active',
    });
    prisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: 'plan-1',
      includedMinutes: 600,
    });
    const headers = signedHeaders(secret, 'invoice-1');

    await service.handleMercadoPago(headers, {
      type: 'subscription_authorized_payment',
      data: { id: 'invoice-1' },
    });

    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: {
        status: 'active',
        includedMinutesRemaining: 600,
        currentPeriodStart: expect.any(Date),
        currentPeriodEnd: expect.any(Date),
      },
    });
  });

  it('marca a assinatura como past_due quando a cobrança recorrente é recusada', async () => {
    mercadoPago.getInvoice.mockResolvedValue({
      paymentStatus: 'rejected',
      preapprovalId: 'mp-preapproval-1',
    });
    prisma.customerSubscription.findFirst.mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'active',
    });
    const headers = signedHeaders(secret, 'invoice-1');

    await service.handleMercadoPago(headers, {
      type: 'subscription_authorized_payment',
      data: { id: 'invoice-1' },
    });

    expect(prisma.customerSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-1' },
      data: { status: 'past_due' },
    });
    expect(prisma.subscriptionPlan.findUnique).not.toHaveBeenCalled();
  });
});
