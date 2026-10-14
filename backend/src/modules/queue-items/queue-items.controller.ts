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
import { CreateQueueItemDto } from './dto/create-queue-item.dto';
import { UpdateQueueItemDto } from './dto/update-queue-item.dto';
import { QueueItemsService } from './queue-items.service';

@Controller('queue-items')
export class QueueItemsController {
  constructor(private readonly queueItemsService: QueueItemsService) {}

  @UseGuards(AdminJwtGuard)
  @Get('admin')
  listAll() {
    return this.queueItemsService.listAll();
  }

  @UseGuards(AdminJwtGuard)
  @Post()
  create(@Body() dto: CreateQueueItemDto) {
    return this.queueItemsService.create(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQueueItemDto) {
    return this.queueItemsService.update(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queueItemsService.remove(id);
  }
}
