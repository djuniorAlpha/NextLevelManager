import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createAdminAndLogin,
  createTestApp,
  TestAppContext,
} from './utils/create-test-app';

describe('Auth (e2e)', () => {
  let context: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    context = await createTestApp();
    app = context.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('devolve accessToken para credenciais válidas', async () => {
    const { username, password } = await createAdminAndLogin(context);

    const response = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ username, password })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.admin.username).toBe(username);
  });

  it('rejeita senha incorreta com 401', async () => {
    const { username } = await createAdminAndLogin(context);

    await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ username, password: 'senha-errada' })
      .expect(401);
  });

  it('rejeita body inválido com 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({})
      .expect(400);
  });
});
