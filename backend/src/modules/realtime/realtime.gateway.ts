import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const apiKey = client.handshake.auth?.apiKey as string | undefined;
    const token = client.handshake.auth?.token as string | undefined;

    if (apiKey) {
      const machine = await this.prisma.machine.findUnique({
        where: { apiKey },
      });
      if (!machine) {
        client.disconnect(true);
        return;
      }
      await client.join(`machine:${machine.id}`);
      return;
    }

    if (token) {
      try {
        await this.jwtService.verifyAsync(token);
        await client.join('admin');
        return;
      } catch {
        client.disconnect(true);
        return;
      }
    }

    this.logger.warn(`Conexão sem apiKey/token recusada: ${client.id}`);
    client.disconnect(true);
  }

  handleDisconnect() {}

  emitMachineStatusChanged(machineId: string, status: string) {
    this.server
      .to('admin')
      .emit('machine.status.changed', { machineId, status });
  }

  emitPaymentConfirmed(
    machineId: string,
    paymentId: string,
    tokenCode?: string,
    sessionId?: string,
  ) {
    this.server
      .to(`machine:${machineId}`)
      .emit('payment.confirmed', { paymentId, tokenCode, sessionId });
  }

  emitForceAction(machineId: string, action: 'lock' | 'unlock' | 'shutdown') {
    this.server
      .to(`machine:${machineId}`)
      .emit('machine.force-action', { action });
  }
}
