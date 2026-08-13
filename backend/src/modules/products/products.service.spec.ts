import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      productSaleItem: {
        findFirst: jest.fn(),
      },
    };
    service = new ProductsService(prisma);
  });

  it('listAll ordena por nome', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await service.listAll();
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('create delega ao Prisma com o DTO recebido', async () => {
    const dto = { name: 'Coca-Cola lata', priceCents: 600 };
    prisma.product.create.mockResolvedValue({ id: 'prod-1', ...dto, active: true });

    const result = await service.create(dto);

    expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
    expect(result.id).toBe('prod-1');
  });

  it('update lança NotFoundException quando o produto não existe', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(
      service.update('ghost', { name: 'x' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('update aplica as mudanças quando o produto existe', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
    prisma.product.update.mockResolvedValue({ id: 'prod-1', name: 'novo nome' });

    const result = await service.update('prod-1', { name: 'novo nome' });

    expect(result.name).toBe('novo nome');
  });

  it('remove lança NotFoundException quando o produto não existe', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
  });

  it('remove deleta quando o produto existe e não tem vendas', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
    prisma.productSaleItem.findFirst.mockResolvedValue(null);
    prisma.product.delete.mockResolvedValue({});

    await expect(service.remove('prod-1')).resolves.toEqual({ ok: true });
    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
    });
  });

  it('remove lança ConflictException quando o produto já tem vendas', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
    prisma.productSaleItem.findFirst.mockResolvedValue({ id: 'item-1' });

    await expect(service.remove('prod-1')).rejects.toThrow(ConflictException);
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });
});
