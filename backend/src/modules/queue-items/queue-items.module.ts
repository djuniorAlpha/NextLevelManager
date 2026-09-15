import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { QueueItemsController } from './queue-items.controller';
import { QueueItemsService } from './queue-items.service';

@Module({
  imports: [AuthModule],
  controllers: [QueueItemsController],
  providers: [QueueItemsService],
  exports: [QueueItemsService],
})
export class QueueItemsModule {}
