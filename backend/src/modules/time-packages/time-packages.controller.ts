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
import { CreateTimePackageDto } from './dto/create-time-package.dto';
import { UpdateTimePackageDto } from './dto/update-time-package.dto';
import { TimePackagesService } from './time-packages.service';

@Controller('time-packages')
export class TimePackagesController {
  constructor(private readonly timePackagesService: TimePackagesService) {}

  @Get()
  listActive() {
    return this.timePackagesService.listActive();
  }

  @UseGuards(AdminJwtGuard)
  @Get('admin')
  listAll() {
    return this.timePackagesService.listAll();
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateTimePackageDto) {
    return this.timePackagesService.create(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimePackageDto) {
    return this.timePackagesService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timePackagesService.remove(id);
  }
}
