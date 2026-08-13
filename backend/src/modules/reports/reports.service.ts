import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetFinancialReportDto } from './dto/get-financial-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancialReport(dto: GetFinancialReportDto) {
    const from = new Date(`${dto.from}T00:00:00.000Z`);
    const toExclusive = new Date(`${dto.to}T00:00:00.000Z`);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

    if (from >= toExclusive) {
      throw new BadRequestException(
        '"from" deve ser anterior ou igual a "to"',
      );
    }

    const where = {
      status: 'approved' as const,
      paidAt: { gte: from, lt: toExclusive },
    };

    const [totals, byMethod, byPurpose] = await Promise.all([
      this.prisma.payment.aggregate({
        where,
        _sum: { amountCents: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { amountCents: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['purpose'],
        where,
        _sum: { amountCents: true },
        _count: true,
      }),
    ]);

    const totalCents = totals._sum.amountCents ?? 0;
    const paymentCount = totals._count;

    return {
      from: dto.from,
      to: dto.to,
      totalCents,
      paymentCount,
      averageTicketCents:
        paymentCount > 0 ? Math.round(totalCents / paymentCount) : 0,
      byMethod: byMethod.map((row) => ({
        method: row.method,
        totalCents: row._sum.amountCents ?? 0,
        count: row._count,
      })),
      byPurpose: byPurpose.map((row) => ({
        purpose: row.purpose,
        totalCents: row._sum.amountCents ?? 0,
        count: row._count,
      })),
    };
  }
}
