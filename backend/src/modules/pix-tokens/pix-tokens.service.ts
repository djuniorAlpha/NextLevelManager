import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Machine, Payment, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
const MAX_CODE_GENERATION_ATTEMPTS = 5;

export type PixTokenStatus = 'active' | 'expired' | 'exhausted';

@Injectable()
export class PixTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async createForPayment(payment: Payment, allocatedSeconds: number) {
    const settings = await this.settings.get();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + settings.pixTokenValidityDays);

    return this.prisma.$transaction(async (tx) => {
      const token = await this.createTokenWithRetry(tx, {
        paymentId: payment.id,
        totalSeconds: allocatedSeconds,
        remainingSeconds: allocatedSeconds,
        expiresAt,
      });

      const session = await tx.session.create({
        data: {
          machineId: payment.machineId!,
          paymentId: payment.id,
          tokenId: token.id,
          source: 'pix_guest',
          allocatedSeconds,
        },
      });

      return { token, session };
    });
  }

  async redeemAtMachine(machine: Machine, rawCode: string) {
    const code = rawCode.trim().toUpperCase();

    return this.prisma.$transaction(
      async (tx) => {
        const token = await tx.pixToken.findUnique({ where: { code } });
        if (!token) {
          throw new NotFoundException('Código não encontrado');
        }

        if (token.expiresAt.getTime() < Date.now()) {
          throw new BadRequestException('Código expirado');
        }

        const settings = await this.settings.get();
        const minRemainingSeconds =
          settings.pixTokenMinRemainingMinutes * 60;
        if (token.remainingSeconds < minRemainingSeconds) {
          throw new BadRequestException('Tempo insuficiente neste código');
        }

        const activeSession = await tx.session.findFirst({
          where: { tokenId: token.id, endedAt: null },
        });
        if (activeSession) {
          throw new ConflictException(
            'Código já está em uso em outra estação',
          );
        }

        const session = await tx.session.create({
          data: {
            machineId: machine.id,
            tokenId: token.id,
            source: 'pix_guest',
            allocatedSeconds: token.remainingSeconds,
          },
        });

        return {
          sessionId: session.id,
          allocatedSeconds: session.allocatedSeconds,
          source: session.source,
          tokenCode: token.code,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async listForAdmin() {
    const tokens = await this.prisma.pixToken.findMany({
      include: {
        payment: { select: { amountCents: true, externalPaymentId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((token) => ({
      ...token,
      status: this.resolveStatus(token),
    }));
  }

  private resolveStatus(token: {
    remainingSeconds: number;
    expiresAt: Date;
  }): PixTokenStatus {
    if (token.remainingSeconds <= 0) {
      return 'exhausted';
    }
    if (token.expiresAt.getTime() < Date.now()) {
      return 'expired';
    }
    return 'active';
  }

  private async createTokenWithRetry(
    tx: Prisma.TransactionClient,
    data: {
      paymentId: string;
      totalSeconds: number;
      remainingSeconds: number;
      expiresAt: Date;
    },
  ) {
    for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = this.generateCode();
      try {
        return await tx.pixToken.create({ data: { ...data, code } });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }
    throw new InternalServerErrorException(
      'Não foi possível gerar um código de token único',
    );
  }

  private generateCode(): string {
    const bytes = randomBytes(CODE_LENGTH);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return code;
  }
}
