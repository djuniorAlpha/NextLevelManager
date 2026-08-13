import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoService } from '../payments/mercado-pago.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

const ACTIVE_SUBSCRIPTION_STATUSES = ['pending', 'active'] as const;

@Injectable()
export class SubscriptionsService {
  private readonly backUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPago: MercadoPagoService,
    config: ConfigService,
  ) {
    const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3001';
    this.backUrl = `${corsOrigin}/login`;
  }

  listActivePlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { priceCents: 'asc' },
    });
  }

  listAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { priceCents: 'asc' },
    });
  }

  createPlan(dto: CreateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto) {
    await this.assertPlanExists(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async removePlan(id: string) {
    await this.assertPlanExists(id);

    const hasSubscriptions = await this.prisma.customerSubscription.findFirst(
      { where: { planId: id } },
    );
    if (hasSubscriptions) {
      throw new ConflictException(
        'Plano já tem assinantes e não pode ser excluído. Marque-o como inativo.',
      );
    }

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { ok: true };
  }

  listAllSubscriptions() {
    return this.prisma.customerSubscription.findMany({
      include: { plan: true, customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listCustomerSubscriptions(customerId: string) {
    return this.prisma.customerSubscription.findMany({
      where: { customerId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscription(customerId: string, dto: CreateSubscriptionDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.active) {
      throw new NotFoundException('Plano não encontrado ou inativo');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    if (plan.maxActiveSubscribers != null) {
      const activeCount = await this.prisma.customerSubscription.count({
        where: {
          planId: plan.id,
          status: { in: [...ACTIVE_SUBSCRIPTION_STATUSES] },
        },
      });
      if (activeCount >= plan.maxActiveSubscribers) {
        throw new BadRequestException('Plano esgotado');
      }
    }

    const payerEmail = dto.payerEmail ?? customer.email;
    if (!payerEmail) {
      throw new BadRequestException('Informe o e-mail do cliente pra assinar');
    }

    if (dto.payerEmail && dto.payerEmail !== customer.email) {
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { email: dto.payerEmail },
      });
    }

    let preapprovalPlanId = plan.mercadoPagoPreapprovalPlanId;
    if (!preapprovalPlanId) {
      const createdPlan = await this.mercadoPago.createPreapprovalPlan({
        name: plan.name,
        priceCents: plan.priceCents,
        backUrl: this.backUrl,
      });
      preapprovalPlanId = createdPlan.id;
      await this.prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { mercadoPagoPreapprovalPlanId: preapprovalPlanId },
      });
    }

    const subscription = await this.prisma.customerSubscription.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: 'pending',
      },
    });

    try {
      const preapproval = await this.mercadoPago.createPreapprovalForCustomer({
        preapprovalPlanId,
        payerEmail,
        externalReference: subscription.id,
        reason: plan.name,
        backUrl: this.backUrl,
      });

      await this.prisma.customerSubscription.update({
        where: { id: subscription.id },
        data: { mercadoPagoPreapprovalId: preapproval.id },
      });

      return { subscriptionId: subscription.id, checkoutUrl: preapproval.initPoint };
    } catch (error) {
      await this.prisma.customerSubscription.delete({
        where: { id: subscription.id },
      });
      throw error;
    }
  }

  async cancelSubscription(customerId: string, subscriptionId: string) {
    const subscription = await this.prisma.customerSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!subscription || subscription.customerId !== customerId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (subscription.mercadoPagoPreapprovalId) {
      await this.mercadoPago.cancelPreapproval(
        subscription.mercadoPagoPreapprovalId,
      );
    }

    await this.prisma.customerSubscription.update({
      where: { id: subscriptionId },
      data: { status: 'canceled' },
    });

    return { ok: true };
  }

  private async assertPlanExists(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    return plan;
  }
}
