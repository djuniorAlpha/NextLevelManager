import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PixTokensModule } from '../pix-tokens/pix-tokens.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [PaymentsModule, RealtimeModule, PixTokensModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
