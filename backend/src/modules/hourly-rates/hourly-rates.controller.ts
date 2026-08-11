import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CreateHourlyRateDto } from './dto/create-hourly-rate.dto';
import { UpdateHourlyRateDto } from './dto/update-hourly-rate.dto';
import { HourlyRatesService } from './hourly-rates.service';

@Controller('hourly-rates')
export class HourlyRatesController {
  constructor(private readonly hourlyRatesService: HourlyRatesService) {}

  @Get()
  listActive() {
    return this.hourlyRatesService.listActive();
  }

  @UseGuards(AdminJwtGuard)
  @Get('admin')
  listAll() {
    return this.hourlyRatesService.listAll();
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateHourlyRateDto) {
    return this.hourlyRatesService.create(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHourlyRateDto) {
    return this.hourlyRatesService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hourlyRatesService.remove(id);
  }
}
