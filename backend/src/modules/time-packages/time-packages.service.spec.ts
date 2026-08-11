import { NotFoundException } from '@nestjs/common';
import { TimePackagesService } from './time-packages.service';

describe('TimePackagesService', () => {
  let service: TimePackagesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      timePackage: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new TimePackagesService(prisma);
  });

  it('listActive filtra por active=true', async () => {
    prisma.timePackage.findMany.mockResolvedValue([]);
    await service.listActive();
    expect(prisma.timePackage.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { minutes: 'asc' },
    });
  });

  it('create delega ao Prisma com o DTO recebido', async () => {
    const dto = { label: '1 hora', minutes: 60, priceCents: 500 };
    prisma.timePackage.create.mockResolvedValue({
      id: 'pkg-1',
      ...dto,
      active: true,
    });

    const result = await service.create(dto);

    expect(prisma.timePackage.create).toHaveBeenCalledWith({ data: dto });
    expect(result.id).toBe('pkg-1');
  });

  it('update lança NotFoundException quando o pacote não existe', async () => {
    prisma.timePackage.findUnique.mockResolvedValue(null);
    await expect(
      service.update('ghost', { label: 'x' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('update aplica as mudanças quando o pacote existe', async () => {
    prisma.timePackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
    prisma.timePackage.update.mockResolvedValue({
      id: 'pkg-1',
      label: 'novo nome',
    });

    const result = await service.update('pkg-1', { label: 'novo nome' });

    expect(result.label).toBe('novo nome');
  });

  it('remove lança NotFoundException quando o pacote não existe', async () => {
    prisma.timePackage.findUnique.mockResolvedValue(null);
    await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
  });

  it('remove deleta quando o pacote existe', async () => {
    prisma.timePackage.findUnique.mockResolvedValue({ id: 'pkg-1' });
    prisma.timePackage.delete.mockResolvedValue({});

    await expect(service.remove('pkg-1')).resolves.toEqual({ ok: true });
    expect(prisma.timePackage.delete).toHaveBeenCalledWith({
      where: { id: 'pkg-1' },
    });
  });
});
