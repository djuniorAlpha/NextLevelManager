import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHourlyRateDto } from './dto/create-hourly-rate.dto';
import { UpdateHourlyRateDto } from './dto/update-hourly-rate.dto';

@Injectable()
export class HourlyRatesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.hourlyRate.findMany({ where: { active: true } });
  }

  listAll() {
    return this.prisma.hourlyRate.findMany();
  }

  create(dto: CreateHourlyRateDto) {
    return this.prisma.hourlyRate.create({ data: dto });
  }

  async update(id: string, dto: UpdateHourlyRateDto) {
    await this.assertExists(id);
    return this.prisma.hourlyRate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.hourlyRate.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const hourlyRate = await this.prisma.hourlyRate.findUnique({
      where: { id },
    });
    if (!hourlyRate) {
      throw new NotFoundException('Tarifa por hora não encontrada');
    }
    return hourlyRate;
  }
}
