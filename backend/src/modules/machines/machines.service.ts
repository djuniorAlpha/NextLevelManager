import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RegisterMachineDto } from './dto/register-machine.dto';
import { MachineStatus } from '@prisma/client';

const ONLINE_THRESHOLD_MS = 60_000;

@Injectable()
export class MachinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getRegistration(macAddress: string) {
    const machine = await this.prisma.machine.findUnique({
      where: { macAddress },
    });
    if (!machine) {
      throw new NotFoundException('Estação não registrada');
    }
    return { computerUuid: machine.id, machineNumber: machine.machineNumber };
  }

  async register(dto: RegisterMachineDto) {
    const existing = await this.prisma.machine.findUnique({
      where: { macAddress: dto.macAddress },
    });
    if (existing) {
      throw new ConflictException(
        'Estação já registrada para esse endereço MAC',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const last = await tx.machine.findFirst({
        orderBy: { machineNumber: 'desc' },
      });
      const machineNumber = (last?.machineNumber ?? 0) + 1;

      const machine = await tx.machine.create({
        data: {
          machineNumber,
          macAddress: dto.macAddress,
          hostname: dto.hostname,
          ipAddress: dto.ipAddress,
          apiKey: randomUUID(),
        },
      });

      return {
        computerUuid: machine.id,
        machineNumber: machine.machineNumber,
        apiKey: machine.apiKey,
      };
    });
  }

  async heartbeat(machineId: string, status: MachineStatus) {
    await this.prisma.machine.update({
      where: { id: machineId },
      data: { status, lastHeartbeatAt: new Date() },
    });
    this.realtime.emitMachineStatusChanged(machineId, status);
  }

  async listForAdmin() {
    const machines = await this.prisma.machine.findMany({
      orderBy: { machineNumber: 'asc' },
    });
    const now = Date.now();
    return machines.map((machine) => ({
      ...machine,
      online: Boolean(
        machine.lastHeartbeatAt &&
        now - machine.lastHeartbeatAt.getTime() < ONLINE_THRESHOLD_MS,
      ),
    }));
  }

  private async assertExists(id: string) {
    const machine = await this.prisma.machine.findUnique({ where: { id } });
    if (!machine) {
      throw new NotFoundException('Estação não encontrada');
    }
    return machine;
  }

  async forceLock(id: string) {
    await this.assertExists(id);
    this.realtime.emitForceAction(id, 'lock');
    return { ok: true };
  }

  async forceUnlock(id: string) {
    await this.assertExists(id);
    this.realtime.emitForceAction(id, 'unlock');
    return { ok: true };
  }

  async forceShutdown(id: string) {
    await this.assertExists(id);
    this.realtime.emitForceAction(id, 'shutdown');
    return { ok: true };
  }
}
