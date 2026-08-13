import { Controller, Post, UseGuards } from '@nestjs/common';
import type { Machine } from '@prisma/client';
import { CurrentCustomer } from '../../common/decorators/current-customer.decorator';
import type { CurrentCustomerPayload } from '../../common/decorators/current-customer.decorator';
import { CurrentMachine } from '../../common/decorators/current-machine.decorator';
import { CustomerJwtGuard } from '../../common/guards/customer-jwt.guard';
import { MachineApiKeyGuard } from '../../common/guards/machine-api-key.guard';
import { SessionsService } from './sessions.service';

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @UseGuards(MachineApiKeyGuard, CustomerJwtGuard)
  @Post('machines/:uuid/sessions/start-for-customer')
  startForCustomer(
    @CurrentMachine() machine: Machine,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    return this.sessionsService.startForCustomer(machine, customer.sub);
  }
}
