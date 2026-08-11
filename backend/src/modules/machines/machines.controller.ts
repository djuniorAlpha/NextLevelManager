import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { MachineApiKeyGuard } from '../../common/guards/machine-api-key.guard';
import { CurrentMachine } from '../../common/decorators/current-machine.decorator';
import type { Machine } from '@prisma/client';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { RegisterMachineDto } from './dto/register-machine.dto';
import { MachinesService } from './machines.service';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get('registration')
  getRegistration(@Query('mac') mac?: string) {
    if (!mac) {
      throw new NotFoundException('Parâmetro mac é obrigatório');
    }
    return this.machinesService.getRegistration(mac);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  register(@Body() dto: RegisterMachineDto) {
    return this.machinesService.register(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(MachineApiKeyGuard)
  @Post(':uuid/heartbeat')
  heartbeat(@CurrentMachine() machine: Machine, @Body() dto: HeartbeatDto) {
    return this.machinesService.heartbeat(machine.id, dto.currentStatus);
  }

  @UseGuards(AdminJwtGuard)
  @Get()
  listForAdmin() {
    return this.machinesService.listForAdmin();
  }

  @UseGuards(AdminJwtGuard)
  @Post(':id/force-lock')
  forceLock(@Param('id') id: string) {
    return this.machinesService.forceLock(id);
  }

  @UseGuards(AdminJwtGuard)
  @Post(':id/force-unlock')
  forceUnlock(@Param('id') id: string) {
    return this.machinesService.forceUnlock(id);
  }

  @UseGuards(AdminJwtGuard)
  @Post(':id/force-shutdown')
  forceShutdown(@Param('id') id: string) {
    return this.machinesService.forceShutdown(id);
  }
}
