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

      const totalCents = dto.items.reduce((sum, item) => {
        const product = productsById.get(item.productId)!;
        return sum + product.priceCents * item.quantity;
      }, 0);

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
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: productsById.get(item.productId)!.priceCents,
            })),
          },
        },
        include: SALE_INCLUDE,
      });
    });
  }
}
