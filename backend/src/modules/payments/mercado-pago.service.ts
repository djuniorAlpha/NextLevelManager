import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Invoice, MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';

export interface PixChargeResult {
  externalPaymentId: string;
  qrCodeBase64: string | null;
  qrCodeText: string | null;
}

export interface PreapprovalResult {
  id: string;
  initPoint: string | null;
  status: string | undefined;
}

@Injectable()
export class MercadoPagoService {
  private readonly payment: Payment;
  private readonly preApproval: PreApproval;
  private readonly invoice: Invoice;
  private readonly payerEmail: string;

  constructor(config: ConfigService) {
    const paymentsAccessToken = config.get<string>('MERCADOPAGO_ACCESS_TOKEN') ?? '';
    // No sandbox do Mercado Pago, cada aplicação de teste só funciona pro produto
    // declarado nela (Pagamentos vs. Assinaturas) — por isso um segundo token
    // opcional pra Preapproval. Em produção, normalmente os dois apontam pra
    // mesma credencial (uma conta real habilitada pra tudo).
    const subscriptionsAccessToken =
      config.get<string>('MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN') ??
      paymentsAccessToken;

    this.payment = new Payment(
      new MercadoPagoConfig({ accessToken: paymentsAccessToken }),
    );
    const subscriptionsConfig = new MercadoPagoConfig({
      accessToken: subscriptionsAccessToken,
    });
    this.preApproval = new PreApproval(subscriptionsConfig);
    this.invoice = new Invoice(subscriptionsConfig);
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

  async createPreapprovalForCustomer(params: {
    priceCents: number;
    payerEmail: string;
    externalReference: string;
    reason: string;
    backUrl: string;
  }): Promise<PreapprovalResult> {
    const result = await this.preApproval.create({
      body: {
        payer_email: params.payerEmail,
        external_reference: params.externalReference,
        reason: params.reason,
        back_url: params.backUrl,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: params.priceCents / 100,
          currency_id: 'BRL',
        },
      },
    });

    return {
      id: String(result.id),
      initPoint: result.init_point ?? null,
      status: result.status,
    };
  }

  async getPreapproval(id: string): Promise<{ status: string | undefined }> {
    const result = await this.preApproval.get({ id });
    return { status: result.status };
  }

  async cancelPreapproval(id: string): Promise<void> {
    await this.preApproval.update({ id, body: { status: 'cancelled' } });
  }

  async updatePreapprovalAmount(id: string, priceCents: number): Promise<void> {
    await this.preApproval.update({
      id,
      body: {
        auto_recurring: {
          transaction_amount: priceCents / 100,
          currency_id: 'BRL',
        },
      },
    });
  }

  async getInvoice(
    id: string,
  ): Promise<{ paymentStatus: string | undefined; preapprovalId: string | undefined }> {
    const result = await this.invoice.get({ id });
    return {
      paymentStatus: result.payment?.status,
      preapprovalId: result.preapproval_id,
    };
  }
}
