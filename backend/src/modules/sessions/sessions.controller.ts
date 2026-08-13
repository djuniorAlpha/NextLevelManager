import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { Machine } from '@prisma/client';
import { CurrentCustomer } from '../../common/decorators/current-customer.decorator';
import type { CurrentCustomerPayload } from '../../common/decorators/current-customer.decorator';
import { CurrentMachine } from '../../common/decorators/current-machine.decorator';
import { CustomerJwtGuard } from '../../common/guards/customer-jwt.guard';
import { MachineApiKeyGuard } from '../../common/guards/machine-api-key.guard';
import { EndSessionDto } from './dto/end-session.dto';
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

  @UseGuards(MachineApiKeyGuard)
  @Post('machines/:uuid/sessions/:sessionId/end')
  endSession(
    @CurrentMachine() machine: Machine,
    @Param('sessionId') sessionId: string,
    @Body() dto: EndSessionDto,
  ) {
    return this.sessionsService.endSession(
      machine,
      sessionId,
      dto.consumedSeconds,
    );
  }
}
