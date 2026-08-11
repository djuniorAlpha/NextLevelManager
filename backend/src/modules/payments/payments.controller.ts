import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Machine } from '@prisma/client';
import { CurrentMachine } from '../../common/decorators/current-machine.decorator';
import { MachineApiKeyGuard } from '../../common/guards/machine-api-key.guard';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(MachineApiKeyGuard)
  @Post('machines/:uuid/payments/pix')
  createPix(
    @CurrentMachine() machine: Machine,
    @Body() dto: CreatePixPaymentDto,
  ) {
    return this.paymentsService.createPixForMachine(machine, dto);
  }

  @UseGuards(MachineApiKeyGuard)
  @Get('payments/:id')
  getPayment(@CurrentMachine() machine: Machine, @Param('id') id: string) {
    return this.paymentsService.getPaymentForMachine(machine, id);
  }
}
