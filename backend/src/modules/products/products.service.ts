import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.product.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.assertExists(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.assertExists(id);

    const hasSales = await this.prisma.productSaleItem.findFirst({
      where: { productId: id },
    });
    if (hasSales) {
      throw new ConflictException(
        'Produto já possui vendas registradas e não pode ser excluído. Marque-o como inativo.',
      );
    }

    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
  }
}
