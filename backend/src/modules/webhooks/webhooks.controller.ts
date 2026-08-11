import { Body, Controller, Headers, Post } from '@nestjs/common';
import type { MercadoPagoWebhookBody } from './webhooks.service';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('mercado-pago')
  handleMercadoPago(
    @Headers() headers: Record<string, string>,
    @Body() body: MercadoPagoWebhookBody,
  ) {
    return this.webhooksService.handleMercadoPago(headers, body);
  }
}
