import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  createAdminAndLogin,
  createTestApp,
  randomMac,
  TestAppContext,
} from './utils/create-test-app';

describe('Machines (e2e)', () => {
  let context: TestAppContext;
  let app: INestApplication;

  beforeAll(async () => {
    context = await createTestApp();
    app = context.app;
  });

  afterAll(async () => {
    await app.close();
  });

  it('fluxo completo: registro -> registration -> heartbeat -> admin list -> force actions', async () => {
    const mac = randomMac();

    await request(app.getHttpServer())
      .get(`/machines/registration?mac=${mac}`)
      .expect(404);

    const registerResponse = await request(app.getHttpServer())
      .post('/machines')
      .send({ macAddress: mac, hostname: 'PC-e2e', ipAddress: '192.168.0.50' })
      .expect(201);

    const { computerUuid, apiKey, machineNumber } = registerResponse.body;
    expect(computerUuid).toBeDefined();
    expect(apiKey).toBeDefined();
    expect(machineNumber).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .get(`/machines/registration?mac=${mac}`)
      .expect(200)
      .expect({ computerUuid, machineNumber });

    await request(app.getHttpServer())
      .post('/machines')
      .send({ macAddress: mac, hostname: 'PC-e2e', ipAddress: '192.168.0.50' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/machines/${computerUuid}/heartbeat`)
      .set('X-Api-Key', apiKey)
      .send({ currentStatus: 'time_selection' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/machines/${computerUuid}/heartbeat`)
      .set('X-Api-Key', 'chave-errada')
      .send({ currentStatus: 'time_selection' })
      .expect(401);

    const { accessToken } = await createAdminAndLogin(context);

    const listResponse = await request(app.getHttpServer())
      .get('/machines')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listedMachine = listResponse.body.find(
      (m: any) => m.id === computerUuid,
    );
    expect(listedMachine.status).toBe('time_selection');
    expect(listedMachine.online).toBe(true);

    await request(app.getHttpServer()).get('/machines').expect(401);

    await request(app.getHttpServer())
      .post(`/machines/${computerUuid}/force-lock`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(context.realtimeMock.emitForceAction).toHaveBeenCalledWith(
      computerUuid,
      'lock',
    );

    await request(app.getHttpServer())
      .post(`/machines/${computerUuid}/force-unlock`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(context.realtimeMock.emitForceAction).toHaveBeenCalledWith(
      computerUuid,
      'unlock',
    );

    await request(app.getHttpServer())
      .post(`/machines/${computerUuid}/force-shutdown`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    expect(context.realtimeMock.emitForceAction).toHaveBeenCalledWith(
      computerUuid,
      'shutdown',
    );

    await request(app.getHttpServer())
      .post(`/machines/${computerUuid}/force-lock`)
      .expect(401);
  });

  it('rejeita registro com payload inválido', async () => {
    await request(app.getHttpServer())
      .post('/machines')
      .send({ macAddress: '', hostname: 'PC', ipAddress: 'not-an-ip' })
      .expect(400);
  });
});
