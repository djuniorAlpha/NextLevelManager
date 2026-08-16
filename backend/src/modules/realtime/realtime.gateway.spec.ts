import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from './realtime.gateway';

function mockSocket(auth: Record<string, unknown>) {
  return {
    id: 'socket-1',
    handshake: { auth },
    data: {},
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  };
}

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway;
  let prisma: { machine: { findUnique: jest.Mock } };
  let jwtService: { verifyAsync: jest.Mock };

  beforeEach(() => {
    prisma = { machine: { findUnique: jest.fn() } };
    jwtService = { verifyAsync: jest.fn() };
    gateway = new RealtimeGateway(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('desconecta clientes sem apiKey e sem token', async () => {
    const client = mockSocket({});
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('desconecta quando a apiKey não corresponde a nenhuma estação', async () => {
    prisma.machine.findUnique.mockResolvedValue(null);
    const client = mockSocket({ apiKey: 'invalid' });
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('entra na room machine:{id} quando a apiKey é válida', async () => {
    prisma.machine.findUnique.mockResolvedValue({ id: 'machine-1' });
    const client = mockSocket({ apiKey: 'valid-key' });
    await gateway.handleConnection(client as any);
    expect(client.join).toHaveBeenCalledWith('machine:machine-1');
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('desconecta quando o token de admin é inválido', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const client = mockSocket({ token: 'bad-token' });
    await gateway.handleConnection(client as any);
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('entra na room admin quando o token é válido', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'admin-1' });
    const client = mockSocket({ token: 'good-token' });
    await gateway.handleConnection(client as any);
    expect(client.join).toHaveBeenCalledWith('admin');
  });

  it('emite eventos nas rooms corretas', () => {
    gateway.server = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any;

    gateway.emitMachineStatusChanged('machine-1', 'active');
    expect(gateway.server.to).toHaveBeenCalledWith('admin');
    expect(gateway.server.emit).toHaveBeenCalledWith('machine.status.changed', {
      machineId: 'machine-1',
      status: 'active',
    });

    gateway.emitPaymentConfirmed(
      'machine-1',
      'payment-1',
      'ABC12345',
      'session-1',
    );
    expect(gateway.server.to).toHaveBeenCalledWith('machine:machine-1');
    expect(gateway.server.emit).toHaveBeenCalledWith('payment.confirmed', {
      paymentId: 'payment-1',
      tokenCode: 'ABC12345',
      sessionId: 'session-1',
    });

    gateway.emitForceAction('machine-1', 'lock');
    expect(gateway.server.to).toHaveBeenCalledWith('machine:machine-1');
    expect(gateway.server.emit).toHaveBeenCalledWith('machine.force-action', {
      action: 'lock',
    });
  });
});
