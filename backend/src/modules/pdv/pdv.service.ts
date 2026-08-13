import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePdvSaleDto } from './dto/create-pdv-sale.dto';

const SALE_INCLUDE = {
  items: { include: { product: true } },
  payment: true,
  customer: { select: { id: true, name: true } },
} as const;

@Injectable()
export class PdvService {
  constructor(private readonly prisma: PrismaService) {}

  listSales() {
    return this.prisma.productSale.findMany({
      orderBy: { createdAt: 'desc' },
      include: SALE_INCLUDE,
    });
  }

  async createSale(dto: CreatePdvSaleDto, registeredByAdminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const productIds = dto.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of dto.items) {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Produto ${item.productId} não encontrado`,
          );
        }
        if (!product.active) {
          throw new BadRequestException(
            `Produto "${product.name}" está inativo`,
          );
        }
      }

      if (dto.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: dto.customerId },
        });
        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      let discountPercent: number | null = null;
      if (dto.customerId) {
        const activeSubscription = await tx.customerSubscription.findFirst({
          where: { customerId: dto.customerId, status: 'active' },
          include: { plan: true },
        });
        if (activeSubscription?.plan.pdvDiscountPercent) {
          discountPercent = activeSubscription.plan.pdvDiscountPercent;
        }
      }

      const lineItems = dto.items.map((item) => {
        const product = productsById.get(item.productId)!;
        const unitPriceCents = discountPercent
          ? Math.round(product.priceCents * (1 - discountPercent / 100))
          : product.priceCents;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents,
          discountPercentApplied: discountPercent,
        };
      });

      const totalCents = lineItems.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0,
      );

      const payment = await tx.payment.create({
        data: {
          customerId: dto.customerId,
          purpose: 'product_sale',
          method: dto.method,
          provider: 'manual',
          status: 'approved',
          amountCents: totalCents,
          registeredByAdminId,
          paidAt: new Date(),
        },
      });

      return tx.productSale.create({
        data: {
          paymentId: payment.id,
          customerId: dto.customerId,
          registeredByAdminId,
          totalCents,
          items: { create: lineItems },
        },
        include: SALE_INCLUDE,
      });
    });
  }
}
