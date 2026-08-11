import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { adminUser: { findUnique: jest.Mock } };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = { adminUser: { findUnique: jest.fn() } };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed-token') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('rejeita usuário inexistente', async () => {
    prisma.adminUser.findUnique.mockResolvedValue(null);

    await expect(service.loginAdmin('ghost', 'whatever')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita senha incorreta', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-1',
      username: 'admin',
      name: 'Admin',
      role: 'owner',
      passwordHash,
    });

    await expect(service.loginAdmin('admin', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('devolve accessToken e dados do admin quando credenciais são válidas', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-1',
      username: 'admin',
      name: 'Admin',
      role: 'owner',
      passwordHash,
    });

    const result = await service.loginAdmin('admin', 'correct-password');

    expect(result.accessToken).toBe('signed-token');
    expect(result.admin).toEqual({
      id: 'admin-1',
      name: 'Admin',
      username: 'admin',
      role: 'owner',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'admin-1',
      username: 'admin',
      role: 'owner',
    });
  });
});
