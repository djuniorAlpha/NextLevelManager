import { INestApplication } from '@nestjs/common';
import { createHmac } from 'crypto';
import request from 'supertest';
import {
  createAdminAndLogin,
  createTestApp,
  randomMac,
  TestAppContext,
} from './utils/create-test-app';

const WEBHOOK_SECRET = 'test-webhook-secret';

function signedHeaders(
  dataId: string,
  requestId = `req-${Date.now()}`,
  ts = '1700000000',
) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac('sha256', WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');
  return { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId };
}

describe('Webhooks (e2e)', () => {
  let context: TestAppContext;
  let app: INestApplication;
  let accessToken: string;
  let machineId: string;
  let apiKey: string;

  beforeAll(async () => {
    context = await createTestApp();
    app = context.app;
    ({ accessToken } = await createAdminAndLogin(context));

    const registerResponse = await request(app.getHttpServer())
      .post('/machines')
      .send({
        macAddress: randomMac(),
        hostname: 'PC-webhook',
        ipAddress: '192.168.0.70',
      })
      .expect(201);
    machineId = registerResponse.body.computerUuid;
    apiKey = registerResponse.body.apiKey;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita assinatura inválida com 401', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/mercado-pago')
      .set('x-signature', 'ts=1,v1=lixo')
      .set('x-request-id', 'req-x')
      .send({ data: { id: '999' } })
      .expect(401);
  });

  it('ignora silenciosamente pagamento desconhecido com assinatura válida', async () => {
    const headers = signedHeaders('id-desconhecido');
    const response = await request(app.getHttpServer())
      .post('/webhooks/mercado-pago')
      .set(headers)
      .send({ data: { id: 'id-desconhecido' } })
      .expect(201);

    expect(response.body).toEqual({ ok: true });
  });

  it('aprova o pagamento, cria a Session e notifica via realtime', async () => {
    const timePackage = await request(app.getHttpServer())
      .post('/time-packages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: '1 hora', minutes: 60, priceCents: 500 })
      .expect(201);

    const pixResponse = await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({ timePackageId: timePackage.body.id })
      .expect(201);

    const paymentId = pixResponse.body.paymentId;
    const payment = await context.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    const externalPaymentId = payment!.externalPaymentId!;

    context.mercadoPagoMock.getPaymentStatus.mockResolvedValueOnce('approved');
    const headers = signedHeaders(externalPaymentId);

    await request(app.getHttpServer())
      .post('/webhooks/mercado-pago')
      .set(headers)
      .send({ data: { id: externalPaymentId } })
      .expect(201);

    const updatedPayment = await context.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    expect(updatedPayment!.status).toBe('approved');

    const session = await context.prisma.session.findFirst({
      where: { paymentId },
    });
    expect(session).not.toBeNull();
    expect(session!.allocatedSeconds).toBe(3600);
    expect(session!.source).toBe('pix_guest');

    expect(context.realtimeMock.emitPaymentConfirmed).toHaveBeenCalledWith(
      machineId,
      paymentId,
    );
  });

  it('é idempotente: reenviar o webhook para um pagamento já aprovado não duplica a Session', async () => {
    const timePackage = await request(app.getHttpServer())
      .post('/time-packages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: '2 horas', minutes: 120, priceCents: 900 })
      .expect(201);

    const pixResponse = await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({ timePackageId: timePackage.body.id })
      .expect(201);

    const paymentId = pixResponse.body.paymentId;
    const payment = await context.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    const externalPaymentId = payment!.externalPaymentId!;

    context.mercadoPagoMock.getPaymentStatus.mockResolvedValueOnce('approved');
    const firstHeaders = signedHeaders(externalPaymentId, 'req-first');
    await request(app.getHttpServer())
      .post('/webhooks/mercado-pago')
      .set(firstHeaders)
      .send({ data: { id: externalPaymentId } })
      .expect(201);

    const secondHeaders = signedHeaders(externalPaymentId, 'req-second');
    await request(app.getHttpServer())
      .post('/webhooks/mercado-pago')
      .set(secondHeaders)
      .send({ data: { id: externalPaymentId } })
      .expect(201);

    const sessions = await context.prisma.session.findMany({
      where: { paymentId },
    });
    expect(sessions).toHaveLength(1);
  });
});
