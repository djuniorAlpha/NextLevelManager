import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentCustomer } from '../../common/decorators/current-customer.decorator';
import type { CurrentCustomerPayload } from '../../common/decorators/current-customer.decorator';
import { CustomerJwtGuard } from '../../common/guards/customer-jwt.guard';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangeCustomerPasswordDto } from './dto/change-customer-password.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto.username, dto.password);
  }

  @Post('customer/login')
  loginCustomer(@Body() dto: CustomerLoginDto) {
    return this.authService.loginCustomer(dto.username, dto.password);
  }

  @UseGuards(CustomerJwtGuard)
  @Post('customer/change-password')
  changeCustomerPassword(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Body() dto: ChangeCustomerPasswordDto,
  ) {
    return this.authService.changeCustomerPassword(
      customer.sub,
      dto.newPassword,
    );
  }
}
