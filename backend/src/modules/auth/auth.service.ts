import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

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
}
