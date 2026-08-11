import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Machine } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface MachineRequest {
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string | undefined>;
  machine?: Machine;
}

@Injectable()
export class MachineApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MachineRequest>();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('X-Api-Key header ausente');
    }

    const machine = await this.prisma.machine.findUnique({ where: { apiKey } });
    if (!machine) {
      throw new UnauthorizedException('API key inválida');
    }

    const routeMachineId = request.params?.uuid;
    if (routeMachineId && routeMachineId !== machine.id) {
      throw new UnauthorizedException('API key não corresponde a esta estação');
    }

    request.machine = machine;
    return true;
  }
}
