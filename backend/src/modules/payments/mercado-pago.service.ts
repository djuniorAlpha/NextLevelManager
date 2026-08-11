import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export interface PixChargeResult {
  externalPaymentId: string;
  qrCodeBase64: string | null;
  qrCodeText: string | null;
}

@Injectable()
export class MercadoPagoService {
  private readonly payment: Payment;
  private readonly payerEmail: string;

  constructor(config: ConfigService) {
    const client = new MercadoPagoConfig({
      accessToken: config.get<string>('MERCADOPAGO_ACCESS_TOKEN') ?? '',
    });
    this.payment = new Payment(client);
    this.payerEmail =
      config.get<string>('MERCADOPAGO_PAYER_EMAIL') ?? 'cliente@lanhouse.local';
  }

  async createPixCharge(
    amountCents: number,
    description: string,
  ): Promise<PixChargeResult> {
    const result = await this.payment.create({
      body: {
        transaction_amount: amountCents / 100,
        description,
        payment_method_id: 'pix',
        payer: { email: this.payerEmail },
      },
      requestOptions: { idempotencyKey: randomUUID() },
    });

    return {
      externalPaymentId: String(result.id),
      qrCodeBase64:
        result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      qrCodeText:
        result.point_of_interaction?.transaction_data?.qr_code ?? null,
    };
  }

  async getPaymentStatus(
    externalPaymentId: string,
  ): Promise<string | undefined> {
    const result = await this.payment.get({ id: Number(externalPaymentId) });
    return result.status;
  }
}
