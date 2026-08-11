import { ConflictException, NotFoundException } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MachinesService } from './machines.service';

describe('MachinesService', () => {
  let service: MachinesService;
  let prisma: any;
  let realtime: {
    emitMachineStatusChanged: jest.Mock;
    emitForceAction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      machine: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    realtime = {
      emitMachineStatusChanged: jest.fn(),
      emitForceAction: jest.fn(),
    };
    service = new MachinesService(
      prisma,
      realtime as unknown as RealtimeGateway,
    );
  });

  describe('getRegistration', () => {
    it('lança NotFoundException quando a estação não existe', async () => {
      prisma.machine.findUnique.mockResolvedValue(null);
      await expect(service.getRegistration('AA:BB')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devolve computerUuid e machineNumber quando encontrada', async () => {
      prisma.machine.findUnique.mockResolvedValue({
        id: 'machine-1',
        machineNumber: 3,
      });
      await expect(service.getRegistration('AA:BB')).resolves.toEqual({
        computerUuid: 'machine-1',
        machineNumber: 3,
      });
    });
  });

  describe('register', () => {
    it('rejeita quando já existe estação com o mesmo MAC', async () => {
      prisma.machine.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          macAddress: 'AA:BB',
          hostname: 'PC-1',
          ipAddress: '10.0.0.1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('gera o próximo machineNumber sequencial e cria a estação', async () => {
      prisma.machine.findUnique.mockResolvedValue(null);
      prisma.machine.findFirst.mockResolvedValue({ machineNumber: 5 });
      prisma.machine.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'new-machine', ...data }),
      );

      const result = await service.register({
        macAddress: 'AA:BB',
        hostname: 'PC-1',
        ipAddress: '10.0.0.1',
      });

      expect(result.machineNumber).toBe(6);
      expect(result.computerUuid).toBe('new-machine');
      expect(typeof result.apiKey).toBe('string');
    });

    it('começa em 1 quando não há nenhuma estação cadastrada', async () => {
      prisma.machine.findUnique.mockResolvedValue(null);
      prisma.machine.findFirst.mockResolvedValue(null);
      prisma.machine.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'first-machine', ...data }),
      );

      const result = await service.register({
        macAddress: 'AA:BB',
        hostname: 'PC-1',
        ipAddress: '10.0.0.1',
      });

      expect(result.machineNumber).toBe(1);
    });
  });

  describe('heartbeat', () => {
    it('atualiza status/lastHeartbeatAt e emite evento realtime', async () => {
      prisma.machine.update.mockResolvedValue({});

      await service.heartbeat('machine-1', 'active');

      expect(prisma.machine.update).toHaveBeenCalledWith({
        where: { id: 'machine-1' },
        data: { status: 'active', lastHeartbeatAt: expect.any(Date) },
      });
      expect(realtime.emitMachineStatusChanged).toHaveBeenCalledWith(
        'machine-1',
        'active',
      );
    });
  });

  describe('listForAdmin', () => {
    it('marca online=true quando heartbeat recente e online=false quando antigo/ausente', async () => {
      const now = Date.now();
      prisma.machine.findMany.mockResolvedValue([
        { id: '1', machineNumber: 1, lastHeartbeatAt: new Date(now - 5_000) },
        { id: '2', machineNumber: 2, lastHeartbeatAt: new Date(now - 120_000) },
        { id: '3', machineNumber: 3, lastHeartbeatAt: null },
      ]);

      const result = await service.listForAdmin();

      expect(result.find((m) => m.id === '1')?.online).toBe(true);
      expect(result.find((m) => m.id === '2')?.online).toBe(false);
      expect(result.find((m) => m.id === '3')?.online).toBe(false);
    });
  });

  describe('ações remotas', () => {
    it('força lock/unlock/shutdown emitindo o evento correto quando a estação existe', async () => {
      prisma.machine.findUnique.mockResolvedValue({ id: 'machine-1' });

      await service.forceLock('machine-1');
      await service.forceUnlock('machine-1');
      await service.forceShutdown('machine-1');

      expect(realtime.emitForceAction).toHaveBeenNthCalledWith(
        1,
        'machine-1',
        'lock',
      );
      expect(realtime.emitForceAction).toHaveBeenNthCalledWith(
        2,
        'machine-1',
        'unlock',
      );
      expect(realtime.emitForceAction).toHaveBeenNthCalledWith(
        3,
        'machine-1',
        'shutdown',
      );
    });

    it('lança NotFoundException quando a estação não existe', async () => {
      prisma.machine.findUnique.mockResolvedValue(null);
      await expect(service.forceLock('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
