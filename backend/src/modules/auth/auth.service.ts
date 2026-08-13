import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async loginAdmin(username: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { username },
    });
    if (!admin) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: admin.id,
      username: admin.username,
      role: admin.role,
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
      },
    };
  }

  async loginCustomer(username: string, password: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { username },
    });
    if (!customer) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(
      password,
      customer.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: customer.id,
      username: customer.username,
    });

    return {
      accessToken,
      customer: {
        id: customer.id,
        name: customer.name,
        username: customer.username,
        balanceMinutes: customer.balanceMinutes,
        loyaltyTier: customer.loyaltyTier,
        mustChangePassword: customer.mustChangePassword,
      },
    };
  }

  async changeCustomerPassword(customerId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { passwordHash, mustChangePassword: false },
    });
    return { ok: true };
  }
}
