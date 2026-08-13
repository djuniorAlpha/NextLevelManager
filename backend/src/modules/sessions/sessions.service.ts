import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Machine } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async startForCustomer(machine: Machine, customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const activeSubscription = await this.prisma.customerSubscription.findFirst(
      { where: { customerId, status: 'active' } },
    );

    if ((activeSubscription?.includedMinutesRemaining ?? 0) > 0) {
      const session = await this.prisma.session.create({
        data: {
          machineId: machine.id,
          customerId: customer.id,
          source: 'subscription',
          allocatedSeconds: activeSubscription!.includedMinutesRemaining! * 60,
        },
      });

      return {
        sessionId: session.id,
        allocatedSeconds: session.allocatedSeconds,
        source: session.source,
      };
    }

    if (customer.balanceMinutes <= 0) {
      throw new BadRequestException('Saldo insuficiente');
    }

    const session = await this.prisma.session.create({
      data: {
        machineId: machine.id,
        customerId: customer.id,
        source: 'customer_balance',
        allocatedSeconds: customer.balanceMinutes * 60,
      },
    });

    return {
      sessionId: session.id,
      allocatedSeconds: session.allocatedSeconds,
      source: session.source,
    };
  }

  async endSession(
    machine: Machine,
    sessionId: string,
    consumedSeconds: number,
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.machineId !== machine.id) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.endedAt) {
      return { ok: true };
    }

    const clampedConsumedSeconds = Math.min(
      Math.max(0, consumedSeconds),
      session.allocatedSeconds,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: session.id },
        data: { consumedSeconds: clampedConsumedSeconds, endedAt: new Date() },
      });

      if (!session.customerId) {
        return;
      }

      const consumedMinutes = Math.ceil(clampedConsumedSeconds / 60);

      if (session.source === 'subscription') {
        const activeSubscription = await tx.customerSubscription.findFirst({
          where: { customerId: session.customerId, status: 'active' },
        });
        if (activeSubscription) {
          await tx.customerSubscription.update({
            where: { id: activeSubscription.id },
            data: { includedMinutesRemaining: { decrement: consumedMinutes } },
          });
        }
        return;
      }

      await tx.customer.update({
        where: { id: session.customerId },
        data: { balanceMinutes: { decrement: consumedMinutes } },
      });
    });

    return { ok: true };
  }
}
