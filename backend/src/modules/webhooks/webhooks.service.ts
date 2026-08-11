import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import type { Payment, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MercadoPagoService } from '../payments/mercado-pago.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface MercadoPagoWebhookBody {
  data?: { id?: string | number };
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mercadoPago: MercadoPagoService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async handleMercadoPago(
    headers: Record<string, string>,
    body: MercadoPagoWebhookBody,
  ) {
    this.verifySignature(headers, body);

    const externalPaymentId = body.data?.id;
    if (!externalPaymentId) {
      return { ok: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { externalPaymentId: String(externalPaymentId) },
    });
    if (!payment || payment.status === 'approved') {
      return { ok: true };
    }

    const realStatus = await this.mercadoPago.getPaymentStatus(
      String(externalPaymentId),
    );
    const mappedStatus = this.mapStatus(realStatus);

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: mappedStatus,
        paidAt: mappedStatus === 'approved' ? new Date() : payment.paidAt,
      },
    });

    if (mappedStatus === 'approved' && updated.machineId) {
      const allocatedSeconds = await this.resolveAllocatedSeconds(updated);
      await this.prisma.session.create({
        data: {
          machineId: updated.machineId,
          paymentId: updated.id,
          source: 'pix_guest',
          allocatedSeconds,
        },
      });
      this.realtime.emitPaymentConfirmed(updated.machineId, updated.id);
    }

    return { ok: true };
  }

  private verifySignature(
    headers: Record<string, string>,
    body: MercadoPagoWebhookBody,
  ) {
    const secret = this.config.get<string>('MERCADOPAGO_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn(
        'MERCADOPAGO_WEBHOOK_SECRET não configurado — validação de assinatura desativada',
      );
      return;
    }

    const signatureHeader = headers['x-signature'];
    const requestId = headers['x-request-id'];
    if (!signatureHeader) {
      throw new UnauthorizedException('Assinatura do webhook ausente');
    }

    const parts = Object.fromEntries(
      signatureHeader.split(',').map((part) => {
        const [key, value] = part.split('=');
        return [key.trim(), value?.trim()];
      }),
    );

    const manifest = `id:${body.data?.id};request-id:${requestId};ts:${parts.ts};`;
    const expected = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    if (expected !== parts.v1) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }
  }

  private mapStatus(mpStatus?: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'cancelled':
        return 'expired';
      default:
        return 'pending';
    }
  }

  private async resolveAllocatedSeconds(payment: Payment): Promise<number> {
    if (payment.timePackageId) {
      const timePackage = await this.prisma.timePackage.findUnique({
        where: { id: payment.timePackageId },
      });
      return (timePackage?.minutes ?? 0) * 60;
    }

    if (payment.hourlyRateId) {
      const hourlyRate = await this.prisma.hourlyRate.findUnique({
        where: { id: payment.hourlyRateId },
      });
      if (!hourlyRate || hourlyRate.ratePerHourCents === 0) {
        return 0;
      }
      return Math.round(
        (payment.amountCents / hourlyRate.ratePerHourCents) * 3600,
      );
    }

    return 0;
  }
}
