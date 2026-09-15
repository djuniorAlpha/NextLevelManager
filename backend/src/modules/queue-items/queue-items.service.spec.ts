import { NotFoundException } from '@nestjs/common';
import { QueueItemsService } from './queue-items.service';

describe('QueueItemsService', () => {
  let service: QueueItemsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      queueItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new QueueItemsService(prisma);
  });

  it('listAll ordena pela posição e inclui a estação', async () => {
    prisma.queueItem.findMany.mockResolvedValue([]);
    await service.listAll();
    expect(prisma.queueItem.findMany).toHaveBeenCalledWith({
      orderBy: { order: 'asc' },
      include: { machine: true },
    });
  });

  it('update lança NotFoundException quando o item não existe', async () => {
    prisma.queueItem.findUnique.mockResolvedValue(null);
    await expect(
      service.update('ghost', { username: 'x' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('remove deleta quando o item existe', async () => {
    prisma.queueItem.findUnique.mockResolvedValue({ id: 'item-1' });
    prisma.queueItem.delete.mockResolvedValue({});

    await expect(service.remove('item-1')).resolves.toEqual({ ok: true });
    expect(prisma.queueItem.delete).toHaveBeenCalledWith({
      where: { id: 'item-1' },
    });
  });
});
