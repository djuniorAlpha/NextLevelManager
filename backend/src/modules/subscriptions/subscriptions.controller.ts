import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('subscription-plans')
  listActivePlans() {
    return this.subscriptionsService.listActivePlans();
  }

  @UseGuards(AdminJwtGuard)
  @Get('subscription-plans/admin')
  listAllPlans() {
    return this.subscriptionsService.listAllPlans();
  }

  @UseGuards(AdminJwtGuard)
  @Post('subscription-plans')
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @UseGuards(AdminJwtGuard)
  @Patch('subscription-plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Delete('subscription-plans/:id')
  removePlan(@Param('id') id: string) {
    return this.subscriptionsService.removePlan(id);
  }

  @UseGuards(AdminJwtGuard)
  @Get('subscriptions')
  listAllSubscriptions() {
    return this.subscriptionsService.listAllSubscriptions();
  }

  @UseGuards(AdminJwtGuard)
  @Get('customers/:id/subscriptions')
  listCustomerSubscriptions(@Param('id') id: string) {
    return this.subscriptionsService.listCustomerSubscriptions(id);
  }

  @UseGuards(AdminJwtGuard)
  @Post('customers/:id/subscriptions')
  createSubscription(
    @Param('id') id: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.createSubscription(id, dto);
  }

  @UseGuards(AdminJwtGuard)
  @Post('customers/:id/subscriptions/:subscriptionId/cancel')
  cancelSubscription(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.subscriptionsService.cancelSubscription(id, subscriptionId);
  }

  @UseGuards(AdminJwtGuard)
  @Patch('customers/:id/subscriptions/:subscriptionId/plan')
  changePlan(
    @Param('id') id: string,
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: ChangeSubscriptionPlanDto,
  ) {
    return this.subscriptionsService.changePlan(id, subscriptionId, dto.planId);
  }
}
