import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TimePackagesController } from './time-packages.controller';
import { TimePackagesService } from './time-packages.service';

@Module({
  imports: [AuthModule],
  controllers: [TimePackagesController],
  providers: [TimePackagesService],
  exports: [TimePackagesService],
})
export class TimePackagesModule {}
