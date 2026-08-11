import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './mercado-pago.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoService],
  exports: [MercadoPagoService],
})
export class PaymentsModule {}
