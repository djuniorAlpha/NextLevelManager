import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { TopUpCustomerDto } from './dto/top-up-customer.dto';

const SALT_ROUNDS = 10;

const CUSTOMER_SELECT = {
  id: true,
  name: true,
  username: true,
  mustChangePassword: true,
  taxDocument: true,
  email: true,
  balanceMinutes: true,
  loyaltyTier: true,
  createdAt: true,
} as const;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      select: CUSTOMER_SELECT,
    });
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException(
        'Já existe um cliente com esse nome de usuário',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        username: dto.username,
        passwordHash,
        mustChangePassword: true,
        taxDocument: dto.taxDocument,
        email: dto.email,
      },
      select: CUSTOMER_SELECT,
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.assertExists(id);
    const { password, ...rest } = dto;
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(password
          ? {
              passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
              mustChangePassword: true,
            }
          : {}),
      },
      select: CUSTOMER_SELECT,
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.customer.delete({ where: { id } });
    return { ok: true };
  }

  async topUp(
    id: string,
    dto: TopUpCustomerDto,
    registeredByAdminId: string,
  ) {
    await this.assertExists(id);
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId: id,
          purpose: 'wallet_topup',
          method: dto.method,
          provider: 'manual',
          status: 'approved',
          amountCents: dto.amountCents,
          registeredByAdminId,
          paidAt: new Date(),
        },
      });

      const customer = await tx.customer.update({
        where: { id },
        data: { balanceMinutes: { increment: dto.minutes } },
        select: CUSTOMER_SELECT,
      });

      return { customer, payment };
    });
  }

  private async assertExists(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return customer;
  }
}
