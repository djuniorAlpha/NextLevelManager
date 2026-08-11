import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTimePackageDto } from './dto/create-time-package.dto';
import { UpdateTimePackageDto } from './dto/update-time-package.dto';

@Injectable()
export class TimePackagesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.timePackage.findMany({
      where: { active: true },
      orderBy: { minutes: 'asc' },
    });
  }

  listAll() {
    return this.prisma.timePackage.findMany({ orderBy: { minutes: 'asc' } });
  }

  create(dto: CreateTimePackageDto) {
    return this.prisma.timePackage.create({ data: dto });
  }

  async update(id: string, dto: UpdateTimePackageDto) {
    await this.assertExists(id);
    return this.prisma.timePackage.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.timePackage.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const timePackage = await this.prisma.timePackage.findUnique({
      where: { id },
    });
    if (!timePackage) {
      throw new NotFoundException('Pacote de tempo não encontrado');
    }
    return timePackage;
  }
}
