import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { MercadoPagoService } from '../../src/modules/payments/mercado-pago.service';
import { RealtimeGateway } from '../../src/modules/realtime/realtime.gateway';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface MercadoPagoMock {
  createPixCharge: jest.Mock;
  getPaymentStatus: jest.Mock;
}

export interface RealtimeMock {
  emitMachineStatusChanged: jest.Mock;
  emitPaymentConfirmed: jest.Mock;
  emitForceAction: jest.Mock;
}

export interface TestAppContext {
  app: INestApplication;
  prisma: PrismaService;
  mercadoPagoMock: MercadoPagoMock;
  realtimeMock: RealtimeMock;
}

export async function createTestApp(): Promise<TestAppContext> {
  const mercadoPagoMock: MercadoPagoMock = {
    createPixCharge: jest.fn().mockImplementation(() => ({
      externalPaymentId: `mp-${randomUUID()}`,
      qrCodeBase64: 'base64-qr',
      qrCodeText: 'qr-text',
    })),
    getPaymentStatus: jest.fn().mockResolvedValue('approved'),
  };

  const realtimeMock: RealtimeMock = {
    emitMachineStatusChanged: jest.fn(),
    emitPaymentConfirmed: jest.fn(),
    emitForceAction: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MercadoPagoService)
    .useValue(mercadoPagoMock)
    .overrideProvider(RealtimeGateway)
    .useValue(realtimeMock)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma, mercadoPagoMock, realtimeMock };
}

export async function createAdminAndLogin(
  context: TestAppContext,
  overrides: {
    username?: string;
    password?: string;
    role?: 'owner' | 'attendant';
  } = {},
) {
  const username = overrides.username ?? `admin-${randomUUID()}`;
  const password = overrides.password ?? 'test-password';
  const role = overrides.role ?? 'owner';

  await context.prisma.adminUser.create({
    data: {
      name: 'Test Admin',
      username,
      passwordHash: await bcrypt.hash(password, 4),
      role,
    },
  });

  const response = await request(context.app.getHttpServer())
    .post('/auth/admin/login')
    .send({ username, password })
    .expect(201);

  return {
    username,
    password,
    accessToken: response.body.accessToken as string,
  };
}

export function randomMac() {
  return randomUUID().slice(0, 17).toUpperCase();
}
