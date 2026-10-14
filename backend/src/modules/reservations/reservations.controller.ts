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
import {
  CurrentAdmin,
  type CurrentAdminPayload,
} from '../../common/decorators/current-admin.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(AdminJwtGuard)
  @Get('admin')
  listAll() {
    return this.reservationsService.listAll();
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(
    @Body() dto: CreateReservationDto,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    return this.reservationsService.create(dto, admin.sub);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReservationDto) {
    return this.reservationsService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
