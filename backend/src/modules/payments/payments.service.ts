import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Machine, PaymentPurpose } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePixPaymentDto } from './dto/create-pix-payment.dto';
import { MercadoPagoService } from './mercado-pago.service';

interface ResolvedCharge {
  purpose: PaymentPurpose;
  amountCents: number;
  timePackageId?: string;
  hourlyRateId?: string;
}

const DESCRIPTIONS: Record<PaymentPurpose, string> = {
  package_purchase: 'Pacote de tempo - Next Level',
  hourly_purchase: 'Tempo por hora - Next Level',
  wallet_topup: 'Recarga de saldo - Next Level',
  subscription: 'Assinatura - Next Level',
  console_session: 'Sessão de console - Next Level',
  product_sale: 'Compra no balcão - Next Level',
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPago: MercadoPagoService,
  ) {}

  async createPixForMachine(machine: Machine, dto: CreatePixPaymentDto) {
    const charge = await this.resolveCharge(dto);

    const pixCharge = await this.mercadoPago.createPixCharge(
      charge.amountCents,
      DESCRIPTIONS[charge.purpose],
    );

    const payment = await this.prisma.payment.create({
      data: {
        machineId: machine.id,
        purpose: charge.purpose,
        method: 'pix',
        provider: 'mercado_pago',
        status: 'pending',
        amountCents: charge.amountCents,
        timePackageId: charge.timePackageId,
        hourlyRateId: charge.hourlyRateId,
        externalPaymentId: pixCharge.externalPaymentId,
        qrCodeBase64: pixCharge.qrCodeBase64,
        qrCodeText: pixCharge.qrCodeText,
      },
    });

    return {
      paymentId: payment.id,
      qrCodeBase64: payment.qrCodeBase64,
      qrCodeText: payment.qrCodeText,
      amountCents: payment.amountCents,
      status: payment.status,
    };
  }

  async getPaymentForMachine(machine: Machine, id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.machineId !== machine.id) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    return payment;
  }

  private async resolveCharge(
    dto: CreatePixPaymentDto,
  ): Promise<ResolvedCharge> {
    const wantsPackage = Boolean(dto.timePackageId);
    const wantsHourly = Boolean(dto.hourlyRateId);

    if (wantsPackage === wantsHourly) {
      throw new BadRequestException(
        'Informe timePackageId OU hourlyRateId (com minutes)',
      );
    }

    if (wantsPackage) {
      const timePackage = await this.prisma.timePackage.findUnique({
        where: { id: dto.timePackageId },
      });
      if (!timePackage || !timePackage.active) {
        throw new NotFoundException(
          'Pacote de tempo não encontrado ou inativo',
        );
      }
      return {
        purpose: 'package_purchase',
        amountCents: timePackage.priceCents,
        timePackageId: timePackage.id,
      };
    }

    if (!dto.minutes) {
      throw new BadRequestException('Informe minutes junto com hourlyRateId');
    }

    const hourlyRate = await this.prisma.hourlyRate.findUnique({
      where: { id: dto.hourlyRateId },
    });
    if (!hourlyRate || !hourlyRate.active) {
      throw new NotFoundException('Tarifa por hora não encontrada ou inativa');
    }

    const amountCents = Math.round(
      (hourlyRate.ratePerHourCents * dto.minutes) / 60,
    );
    return {
      purpose: 'hourly_purchase',
      amountCents,
      hourlyRateId: hourlyRate.id,
    };
  }
}
