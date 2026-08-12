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
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { CurrentAdminPayload } from '../../common/decorators/current-admin.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { TopUpCustomerDto } from './dto/top-up-customer.dto';
import { CustomersService } from './customers.service';

@UseGuards(AdminJwtGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('admin')
  listAll() {
    return this.customersService.listAll();
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Post(':id/top-up')
  topUp(
    @Param('id') id: string,
    @Body() dto: TopUpCustomerDto,
    @CurrentAdmin() admin: CurrentAdminPayload,
  ) {
    return this.customersService.topUp(id, dto, admin.sub);
  }
}
