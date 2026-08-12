import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      customer: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    service = new CustomersService(prisma);
  });

  it('listAll ordena por createdAt desc e exclui passwordHash da seleção', async () => {
    prisma.customer.findMany.mockResolvedValue([]);
    await service.listAll();

    const call = prisma.customer.findMany.mock.calls[0][0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
    expect(Object.keys(call.select)).not.toContain('passwordHash');
    expect(call.select).toMatchObject({
      id: true,
      name: true,
      username: true,
      balanceMinutes: true,
      loyaltyTier: true,
    });
  });

  it('create rejeita username duplicado', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({
        name: 'João',
        username: 'joao01',
        password: 'senha123',
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.customer.create).not.toHaveBeenCalled();
  });

  it('create faz hash da senha antes de persistir', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.customer.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'cust-1', ...data, balanceMinutes: 0 }),
    );

    await service.create({
      name: 'João',
      username: 'joao01',
      password: 'senha123',
    });

    const createCall = prisma.customer.create.mock.calls[0][0];
    expect(createCall.data.passwordHash).not.toBe('senha123');
    await expect(
      bcrypt.compare('senha123', createCall.data.passwordHash),
    ).resolves.toBe(true);
  });

  it('create marca mustChangePassword como true (senha é sempre temporária)', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.customer.create.mockResolvedValue({ id: 'cust-1' });

    await service.create({
      name: 'João',
      username: 'joao01',
      password: 'senha123',
    });

    const createCall = prisma.customer.create.mock.calls[0][0];
    expect(createCall.data.mustChangePassword).toBe(true);
  });

  it('update lança NotFoundException quando o cliente não existe', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(
      service.update('ghost', { name: 'x' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('update mantém o hash atual quando password não é informado', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    prisma.customer.update.mockResolvedValue({ id: 'cust-1', name: 'novo' });

    await service.update('cust-1', { name: 'novo' });

    const updateCall = prisma.customer.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('passwordHash');
  });

  it('update re-hash a senha quando password é informado', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    prisma.customer.update.mockResolvedValue({ id: 'cust-1' });

    await service.update('cust-1', { password: 'nova-senha' });

    const updateCall = prisma.customer.update.mock.calls[0][0];
    expect(updateCall.data.passwordHash).toBeDefined();
    await expect(
      bcrypt.compare('nova-senha', updateCall.data.passwordHash),
    ).resolves.toBe(true);
  });

  it('update marca mustChangePassword como true quando o operador redefine a senha', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    prisma.customer.update.mockResolvedValue({ id: 'cust-1' });

    await service.update('cust-1', { password: 'nova-senha' });

    const updateCall = prisma.customer.update.mock.calls[0][0];
    expect(updateCall.data.mustChangePassword).toBe(true);
  });

  it('remove lança NotFoundException quando o cliente não existe', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
  });

  it('remove deleta quando o cliente existe', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    prisma.customer.delete.mockResolvedValue({});

    await expect(service.remove('cust-1')).resolves.toEqual({ ok: true });
    expect(prisma.customer.delete).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
    });
  });

  it('topUp lança NotFoundException quando o cliente não existe', async () => {
    prisma.customer.findUnique.mockResolvedValue(null);
    await expect(
      service.topUp(
        'ghost',
        { minutes: 60, amountCents: 500, method: 'cash' },
        'admin-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('topUp cria o Payment e incrementa balanceMinutes numa transação', async () => {
    prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
    prisma.payment.create.mockResolvedValue({ id: 'pay-1' });
    prisma.customer.update.mockResolvedValue({
      id: 'cust-1',
      balanceMinutes: 60,
    });

    const result = await service.topUp(
      'cust-1',
      { minutes: 60, amountCents: 500, method: 'cash' },
      'admin-1',
    );

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        purpose: 'wallet_topup',
        method: 'cash',
        provider: 'manual',
        status: 'approved',
        amountCents: 500,
        registeredByAdminId: 'admin-1',
      }),
    });
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { balanceMinutes: { increment: 60 } },
      select: expect.anything(),
    });
    expect(result.customer.balanceMinutes).toBe(60);
    expect(result.payment.id).toBe('pay-1');
  });
});
