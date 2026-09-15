import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';

@Injectable()
export class QueueItemsService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.queueItem.findMany({
      orderBy: { order: 'asc' },
      include: { machine: true },
    });
  }

  create(dto: CreateQueueItemDto) {
    return this.prisma.queueItem.create({
      data: dto,
      include: { machine: true },
    });
  }

  async update(id: string, dto: UpdateQueueItemDto) {
    await this.assertExists(id);
    return this.prisma.queueItem.update({
      where: { id },
      data: dto,
      include: { machine: true },
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.queueItem.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const item = await this.prisma.queueItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Item da fila não encontrado');
    }
    return item;
  }
}
