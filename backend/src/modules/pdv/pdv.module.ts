import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PdvController } from './pdv.controller';
import { PdvService } from './pdv.service';

@Module({
  imports: [AuthModule],
  controllers: [PdvController],
  providers: [PdvService],
})
export class PdvModule {}
