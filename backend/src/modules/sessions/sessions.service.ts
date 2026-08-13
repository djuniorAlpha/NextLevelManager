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
}
