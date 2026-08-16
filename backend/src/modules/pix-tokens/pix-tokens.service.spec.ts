import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Machine, Payment } from '@prisma/client';
import { PixTokensService } from './pix-tokens.service';

describe('PixTokensService', () => {
  let service: PixTokensService;
  let prisma: any;
  let settings: { get: jest.Mock };
  let tx: any;

  const MACHINE = { id: 'machine-2' } as Machine;

  beforeEach(() => {
    tx = {
      pixToken: { create: jest.fn(), findUnique: jest.fn() },
      session: { create: jest.fn(), findFirst: jest.fn() },
    };
    prisma = {
      pixToken: { findMany: jest.fn() },
      $transaction: jest.fn((callback: any) => callback(tx)),
    };
    settings = {
      get: jest.fn().mockResolvedValue({
        pixTokenValidityDays: 7,
        pixTokenMinRemainingMinutes: 5,
      }),
    };
    service = new PixTokensService(prisma, settings as any);
  });

  describe('createForPayment', () => {
    it('cria o token com o tempo total e a sessão na máquina de origem', async () => {
      const payment = {
        id: 'payment-1',
        machineId: 'machine-1',
      } as Payment;
      tx.pixToken.create.mockResolvedValue({
        id: 'token-1',
        code: 'ABC23456',
      });
      tx.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.createForPayment(payment, 3600);

      expect(tx.pixToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentId: 'payment-1',
          totalSeconds: 3600,
          remainingSeconds: 3600,
        }),
      });
      expect(tx.session.create).toHaveBeenCalledWith({
        data: {
          machineId: 'machine-1',
          paymentId: 'payment-1',
          tokenId: 'token-1',
          source: 'pix_guest',
          allocatedSeconds: 3600,
        },
      });
      expect(result.token.code).toBe('ABC23456');
    });

    it('tenta novamente ao colidir o código gerado (unique constraint)', async () => {
      const payment = { id: 'payment-1', machineId: 'machine-1' } as Payment;
      const collision = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: 'test' },
      );
      tx.pixToken.create
        .mockRejectedValueOnce(collision)
        .mockResolvedValueOnce({ id: 'token-1', code: 'XYZ23456' });
      tx.session.create.mockResolvedValue({ id: 'session-1' });

      const result = await service.createForPayment(payment, 1800);

      expect(tx.pixToken.create).toHaveBeenCalledTimes(2);
      expect(result.token.code).toBe('XYZ23456');
    });
  });

  describe('redeemAtMachine', () => {
    it('lança NotFoundException quando o código não existe', async () => {
      tx.pixToken.findUnique.mockResolvedValue(null);

      await expect(
        service.redeemAtMachine(MACHINE, 'ghost123'),
      ).rejects.toThrow(NotFoundException);
      expect(tx.session.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando o token está expirado', async () => {
      tx.pixToken.findUnique.mockResolvedValue({
        id: 'token-1',
        code: 'ABC23456',
        remainingSeconds: 600,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.redeemAtMachine(MACHINE, 'abc23456'),
      ).rejects.toThrow(BadRequestException);
      expect(tx.session.create).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando o tempo restante é menor que o mínimo configurado', async () => {
      tx.pixToken.findUnique.mockResolvedValue({
        id: 'token-1',
        code: 'ABC23456',
        remainingSeconds: 60,
        expiresAt: new Date(Date.now() + 100_000),
      });

      await expect(
        service.redeemAtMachine(MACHINE, 'ABC23456'),
      ).rejects.toThrow(BadRequestException);
      expect(tx.session.create).not.toHaveBeenCalled();
    });

    it('lança ConflictException quando o token já está em uso em outra estação', async () => {
      tx.pixToken.findUnique.mockResolvedValue({
        id: 'token-1',
        code: 'ABC23456',
        remainingSeconds: 600,
        expiresAt: new Date(Date.now() + 100_000),
      });
      tx.session.findFirst.mockResolvedValue({ id: 'session-ativa' });

      await expect(
        service.redeemAtMachine(MACHINE, 'ABC23456'),
      ).rejects.toThrow(ConflictException);
      expect(tx.session.create).not.toHaveBeenCalled();
    });

    it('resgata o token alocando todo o tempo restante na estação atual', async () => {
      tx.pixToken.findUnique.mockResolvedValue({
        id: 'token-1',
        code: 'ABC23456',
        remainingSeconds: 900,
        expiresAt: new Date(Date.now() + 100_000),
      });
      tx.session.findFirst.mockResolvedValue(null);
      tx.session.create.mockResolvedValue({
        id: 'session-nova',
        allocatedSeconds: 900,
        source: 'pix_guest',
      });

      const result = await service.redeemAtMachine(MACHINE, 'abc23456');

      expect(tx.session.create).toHaveBeenCalledWith({
        data: {
          machineId: 'machine-2',
          tokenId: 'token-1',
          source: 'pix_guest',
          allocatedSeconds: 900,
        },
      });
      expect(result).toEqual({
        sessionId: 'session-nova',
        allocatedSeconds: 900,
        source: 'pix_guest',
        tokenCode: 'ABC23456',
      });
    });
  });

  describe('listForAdmin', () => {
    it('calcula o status de cada token (esgotado > expirado > ativo)', async () => {
      prisma.pixToken.findMany.mockResolvedValue([
        {
          id: 't-exhausted',
          remainingSeconds: 0,
          expiresAt: new Date(Date.now() + 100_000),
        },
        {
          id: 't-expired',
          remainingSeconds: 600,
          expiresAt: new Date(Date.now() - 1000),
        },
        {
          id: 't-active',
          remainingSeconds: 600,
          expiresAt: new Date(Date.now() + 100_000),
        },
      ]);

      const result = await service.listForAdmin();

      expect(result.map((t) => t.status)).toEqual([
        'exhausted',
        'expired',
        'active',
      ]);
    });
  });
});
