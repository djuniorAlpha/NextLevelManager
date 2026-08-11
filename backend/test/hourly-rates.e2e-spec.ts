import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createAdminAndLogin,
  createTestApp,
  TestAppContext,
} from './utils/create-test-app';

describe('HourlyRates (e2e)', () => {
  let context: TestAppContext;
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    context = await createTestApp();
    app = context.app;
    ({ accessToken } = await createAdminAndLogin(context));
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita criação sem token de admin', async () => {
    await request(app.getHttpServer())
      .post('/hourly-rates')
      .send({ label: 'Padrão', ratePerHourCents: 1000 })
      .expect(401);
  });

  it('CRUD completo como admin, e a listagem pública só mostra tarifas ativas', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/hourly-rates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: 'Padrão', ratePerHourCents: 1000 })
      .expect(201);

    const { id } = createResponse.body;

    const publicList = await request(app.getHttpServer())
      .get('/hourly-rates')
      .expect(200);
    expect(publicList.body.some((r: any) => r.id === id)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/hourly-rates/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ active: false })
      .expect(200);

    const publicListAfterDeactivate = await request(app.getHttpServer())
      .get('/hourly-rates')
      .expect(200);
    expect(publicListAfterDeactivate.body.some((r: any) => r.id === id)).toBe(
      false,
    );

    await request(app.getHttpServer())
      .delete(`/hourly-rates/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
