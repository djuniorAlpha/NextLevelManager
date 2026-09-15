import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueuesService {
  constructor(private readonly prisma: PrismaService) {}

  listAll() {
    return this.prisma.queue.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { machine: true },
        },
      },
    });
  }

  create(dto: CreateQueueDto) {
    return this.prisma.queue.create({ data: dto });
  }

  async update(id: string, dto: UpdateQueueDto) {
    await this.assertExists(id);
    return this.prisma.queue.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.queue.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const queue = await this.prisma.queue.findUnique({ where: { id } });
    if (!queue) {
      throw new NotFoundException('Fila não encontrada');
    }
    return queue;
  }
}
