import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { Machine } from '@prisma/client';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { CurrentMachine } from '../../common/decorators/current-machine.decorator';
import { MachineApiKeyGuard } from '../../common/guards/machine-api-key.guard';
import { RedeemTokenDto } from './dto/redeem-token.dto';
import { PixTokensService } from './pix-tokens.service';

@Controller()
export class PixTokensController {
  constructor(private readonly pixTokensService: PixTokensService) {}

  @UseGuards(MachineApiKeyGuard)
  @Post('machines/:uuid/sessions/start-with-token')
  startWithToken(
    @CurrentMachine() machine: Machine,
    @Body() dto: RedeemTokenDto,
  ) {
    return this.pixTokensService.redeemAtMachine(machine, dto.code);
  }

  @UseGuards(AdminJwtGuard)
  @Get('pix-tokens/admin')
  listForAdmin() {
    return this.pixTokensService.listForAdmin();
  }
}
