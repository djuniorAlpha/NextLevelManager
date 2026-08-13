import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    adminUser: { findUnique: jest.Mock };
    customer: { findUnique: jest.Mock; update: jest.Mock };
  };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = {
      adminUser: { findUnique: jest.fn() },
      customer: { findUnique: jest.fn(), update: jest.fn() },
    };
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

  it('loginCustomer rejeita usuário inexistente', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);

    await expect(
      service.loginCustomer('ghost', 'whatever'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('loginCustomer rejeita senha incorreta', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      username: 'joao',
      name: 'João',
      passwordHash,
      balanceMinutes: 60,
      loyaltyTier: null,
      mustChangePassword: true,
    });

    await expect(
      service.loginCustomer('joao', 'wrong-password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('loginCustomer devolve accessToken e dados do cliente, incluindo mustChangePassword', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      username: 'joao',
      name: 'João',
      passwordHash,
      balanceMinutes: 60,
      loyaltyTier: null,
      mustChangePassword: true,
    });

    const result = await service.loginCustomer('joao', 'correct-password');

    expect(result.accessToken).toBe('signed-token');
    expect(result.customer).toEqual({
      id: 'cust-1',
      name: 'João',
      username: 'joao',
      balanceMinutes: 60,
      loyaltyTier: null,
      mustChangePassword: true,
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'cust-1',
      username: 'joao',
    });
  });

  it('changeCustomerPassword atualiza a senha e zera mustChangePassword', async () => {
    prisma.customer.update.mockResolvedValue({ id: 'cust-1' });

    const result = await service.changeCustomerPassword('cust-1', 'nova-senha');

    expect(result).toEqual({ ok: true });
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: {
        passwordHash: expect.any(String),
        mustChangePassword: false,
      },
    });
  });
});
