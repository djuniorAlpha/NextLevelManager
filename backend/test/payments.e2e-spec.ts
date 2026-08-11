import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import {
  createAdminAndLogin,
  createTestApp,
  randomMac,
  TestAppContext,
} from './utils/create-test-app';

describe('Payments (e2e)', () => {
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
        hostname: 'PC-payments',
        ipAddress: '192.168.0.60',
      })
      .expect(201);

    machineId = registerResponse.body.computerUuid;
    apiKey = registerResponse.body.apiKey;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita sem X-Api-Key', async () => {
    await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .send({})
      .expect(401);
  });

  it('rejeita quando nem timePackageId nem hourlyRateId são informados', async () => {
    await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({})
      .expect(400);
  });

  it('rejeita timePackageId inexistente com 404', async () => {
    await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({ timePackageId: randomUUID() })
      .expect(404);
  });

  it('cria a cobrança Pix para um TimePackage válido e permite consultar depois', async () => {
    const timePackage = await request(app.getHttpServer())
      .post('/time-packages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: '1 hora', minutes: 60, priceCents: 500 })
      .expect(201);

    const createResponse = await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({ timePackageId: timePackage.body.id })
      .expect(201);

    expect(createResponse.body.qrCodeBase64).toBe('base64-qr');
    expect(createResponse.body.amountCents).toBe(500);
    expect(context.mercadoPagoMock.createPixCharge).toHaveBeenCalledWith(
      500,
      expect.any(String),
    );

    const paymentId = createResponse.body.paymentId;

    await request(app.getHttpServer())
      .get(`/payments/${paymentId}`)
      .set('X-Api-Key', apiKey)
      .expect(200);
  });

  it('calcula o valor proporcional para hourlyRateId + minutes', async () => {
    const hourlyRate = await request(app.getHttpServer())
      .post('/hourly-rates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: 'Padrão', ratePerHourCents: 1200 })
      .expect(201);

    const createResponse = await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({ hourlyRateId: hourlyRate.body.id, minutes: 30 })
      .expect(201);

    expect(createResponse.body.amountCents).toBe(600);
  });

  it('devolve 404 ao consultar pagamento de outra estação', async () => {
    const otherMachine = await request(app.getHttpServer())
      .post('/machines')
      .send({
        macAddress: randomMac(),
        hostname: 'PC-other',
        ipAddress: '192.168.0.61',
      })
      .expect(201);

    const timePackage = await request(app.getHttpServer())
      .post('/time-packages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: '30 min', minutes: 30, priceCents: 300 })
      .expect(201);

    const createResponse = await request(app.getHttpServer())
      .post(`/machines/${machineId}/payments/pix`)
      .set('X-Api-Key', apiKey)
      .send({ timePackageId: timePackage.body.id })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/payments/${createResponse.body.paymentId}`)
      .set('X-Api-Key', otherMachine.body.apiKey)
      .expect(404);
  });
});
