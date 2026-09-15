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
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';
import { QueuesService } from './queues.service';

@Controller('queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @UseGuards(AdminJwtGuard)
  @Get('admin')
  listAll() {
    return this.queuesService.listAll();
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateQueueDto) {
    return this.queuesService.create(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQueueDto) {
    return this.queuesService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queuesService.remove(id);
  }
}
