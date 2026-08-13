import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { CreatePdvSaleDto } from './dto/create-pdv-sale.dto';
import { PdvService } from './pdv.service';

@UseGuards(AdminJwtGuard)
@Controller('pdv')
export class PdvController {
  constructor(private readonly pdvService: PdvService) {}

  @Get('sales')
  listSales() {
    return this.pdvService.listSales();
  }

  @Post('sales')
  createSale(
    @Body() dto: CreatePdvSaleDto,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    return this.pdvService.createSale(dto, admin.sub);
  }
}
