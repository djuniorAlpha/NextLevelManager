import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createAdminAndLogin,
  createTestApp,
  TestAppContext,
} from './utils/create-test-app';

describe('TimePackages (e2e)', () => {
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
      .post('/time-packages')
      .send({ label: '1 hora', minutes: 60, priceCents: 500 })
      .expect(401);
  });

  it('CRUD completo como admin, e a listagem pública só mostra pacotes ativos', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/time-packages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: '1 hora', minutes: 60, priceCents: 500 })
      .expect(201);

    const { id } = createResponse.body;

    const publicList = await request(app.getHttpServer())
      .get('/time-packages')
      .expect(200);
    expect(publicList.body.some((p: any) => p.id === id)).toBe(true);

    await request(app.getHttpServer())
      .patch(`/time-packages/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ active: false })
      .expect(200);

    const publicListAfterDeactivate = await request(app.getHttpServer())
      .get('/time-packages')
      .expect(200);
    expect(publicListAfterDeactivate.body.some((p: any) => p.id === id)).toBe(
      false,
    );

    const adminList = await request(app.getHttpServer())
      .get('/time-packages/admin')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(adminList.body.some((p: any) => p.id === id)).toBe(true);

    await request(app.getHttpServer())
      .delete(`/time-packages/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/time-packages/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ active: true })
      .expect(404);
  });
});
