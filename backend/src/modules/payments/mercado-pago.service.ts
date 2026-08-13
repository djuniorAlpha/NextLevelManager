import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { MercadoPagoConfig, Payment, PreApproval, PreApprovalPlan } from 'mercadopago';

export interface PixChargeResult {
  externalPaymentId: string;
  qrCodeBase64: string | null;
  qrCodeText: string | null;
}

export interface PreapprovalPlanResult {
  id: string;
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
  private readonly preApprovalPlan: PreApprovalPlan;
  private readonly payerEmail: string;

  constructor(config: ConfigService) {
    const client = new MercadoPagoConfig({
      accessToken: config.get<string>('MERCADOPAGO_ACCESS_TOKEN') ?? '',
    });
    this.payment = new Payment(client);
    this.preApproval = new PreApproval(client);
    this.preApprovalPlan = new PreApprovalPlan(client);
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

  async createPreapprovalPlan(params: {
    name: string;
    priceCents: number;
    backUrl: string;
  }): Promise<PreapprovalPlanResult> {
    const result = await this.preApprovalPlan.create({
      body: {
        reason: params.name,
        back_url: params.backUrl,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: params.priceCents / 100,
          currency_id: 'BRL',
        },
      },
    });

    return { id: String(result.id) };
  }

  async createPreapprovalForCustomer(params: {
    preapprovalPlanId: string;
    payerEmail: string;
    externalReference: string;
    reason: string;
    backUrl: string;
  }): Promise<PreapprovalResult> {
    const result = await this.preApproval.create({
      body: {
        preapproval_plan_id: params.preapprovalPlanId,
        payer_email: params.payerEmail,
        external_reference: params.externalReference,
        reason: params.reason,
        back_url: params.backUrl,
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
}
