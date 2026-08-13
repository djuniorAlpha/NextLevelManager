import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { GetFinancialReportDto } from './dto/get-financial-report.dto';
import { ReportsService } from './reports.service';

@UseGuards(AdminJwtGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  getFinancialReport(@Query() dto: GetFinancialReportDto) {
    return this.reportsService.getFinancialReport(dto);
  }
}
