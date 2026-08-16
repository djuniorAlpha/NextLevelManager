import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { PixTokensController } from './pix-tokens.controller';
import { PixTokensService } from './pix-tokens.service';

@Module({
  imports: [AuthModule, SettingsModule],
  controllers: [PixTokensController],
  providers: [PixTokensService],
  exports: [PixTokensService],
})
export class PixTokensModule {}
