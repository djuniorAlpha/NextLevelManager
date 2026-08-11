import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MachineApiKeyGuard } from './machine-api-key.guard';

function contextWith(
  headers: Record<string, string>,
  params: Record<string, string> = {},
) {
  const request: any = { headers, params };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext & { request: any };
}

describe('MachineApiKeyGuard', () => {
  let guard: MachineApiKeyGuard;
  let prisma: { machine: { findUnique: jest.Mock } };

  beforeEach(() => {
    prisma = { machine: { findUnique: jest.fn() } };
    guard = new MachineApiKeyGuard(prisma as unknown as PrismaService);
  });

  it('rejeita quando o header X-Api-Key está ausente', async () => {
    const ctx = contextWith({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita quando a API key não corresponde a nenhuma estação', async () => {
    prisma.machine.findUnique.mockResolvedValue(null);
    const ctx = contextWith({ 'x-api-key': 'invalid-key' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita quando a API key é válida mas não corresponde ao :uuid da rota', async () => {
    prisma.machine.findUnique.mockResolvedValue({
      id: 'machine-1',
      apiKey: 'key-1',
    });
    const ctx = contextWith(
      { 'x-api-key': 'key-1' },
      { uuid: 'other-machine' },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('autentica e anexa request.machine quando tudo confere', async () => {
    const machine = { id: 'machine-1', apiKey: 'key-1' };
    prisma.machine.findUnique.mockResolvedValue(machine);
    const ctx = contextWith({ 'x-api-key': 'key-1' }, { uuid: 'machine-1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(ctx.switchToHttp().getRequest().machine).toBe(machine);
  });

  it('autentica sem checar :uuid quando a rota não tem esse parâmetro', async () => {
    const machine = { id: 'machine-1', apiKey: 'key-1' };
    prisma.machine.findUnique.mockResolvedValue(machine);
    const ctx = contextWith({ 'x-api-key': 'key-1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });
});
