import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HourlyRatesController } from './hourly-rates.controller';
import { HourlyRatesService } from './hourly-rates.service';

@Module({
  imports: [AuthModule],
  controllers: [HourlyRatesController],
  providers: [HourlyRatesService],
  exports: [HourlyRatesService],
})
export class HourlyRatesModule {}
