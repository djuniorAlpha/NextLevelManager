import { NotFoundException } from '@nestjs/common';
import { QueuesService } from './queues.service';

describe('QueuesService', () => {
  let service: QueuesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      queue: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new QueuesService(prisma);
  });

  it('listAll inclui os itens ordenados com a estação', async () => {
    prisma.queue.findMany.mockResolvedValue([]);
    await service.listAll();
    expect(prisma.queue.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { machine: true },
        },
      },
    });
  });

  it('update lança NotFoundException quando a fila não existe', async () => {
    prisma.queue.findUnique.mockResolvedValue(null);
    await expect(service.update('ghost', { name: 'x' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('remove deleta quando a fila existe', async () => {
    prisma.queue.findUnique.mockResolvedValue({ id: 'queue-1' });
    prisma.queue.delete.mockResolvedValue({});

    await expect(service.remove('queue-1')).resolves.toEqual({ ok: true });
    expect(prisma.queue.delete).toHaveBeenCalledWith({
      where: { id: 'queue-1' },
    });
  });
});
