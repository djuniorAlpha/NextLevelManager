import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reservation, ReservationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

const CAPACITY_ENV_KEY: Record<ReservationType, string> = {
  pc: 'RESERVATION_PC_CAPACITY',
  console: 'RESERVATION_CONSOLE_CAPACITY',
  room: 'RESERVATION_ROOM_CAPACITY',
};

const TYPE_LABEL: Record<ReservationType, string> = {
  pc: 'PC',
  console: 'Console',
  room: 'Sala',
};

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  listAll() {
    return this.prisma.reservation.findMany({
      orderBy: { startAt: 'asc' },
      include: { customer: true },
    });
  }

  async create(dto: CreateReservationDto, createdByAdminId: string) {
    this.assertCustomerOrGuest(dto.customerId, dto.guestName);

    const startAt = new Date(dto.startAt);
    const endAt = addMinutes(startAt, dto.durationMinutes);
    await this.assertCapacity(dto.type, startAt, endAt);

    return this.prisma.reservation.create({
      data: {
        type: dto.type,
        customerId: dto.customerId,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        startAt,
        durationMinutes: dto.durationMinutes,
        endAt,
        status: dto.status ?? 'confirmed',
        pendingNote: dto.pendingNote,
        createdByAdminId,
      },
      include: { customer: true },
    });
  }

  async update(id: string, dto: UpdateReservationDto) {
    const existing = await this.assertExists(id);

    const effectiveCustomerId =
      dto.customerId !== undefined ? dto.customerId : existing.customerId;
    const effectiveGuestName =
      dto.guestName !== undefined ? dto.guestName : existing.guestName;
    this.assertCustomerOrGuest(effectiveCustomerId, effectiveGuestName);

    const type = dto.type ?? existing.type;
    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const durationMinutes = dto.durationMinutes ?? existing.durationMinutes;
    const endAt = addMinutes(startAt, durationMinutes);
    await this.assertCapacity(type, startAt, endAt, id);

    return this.prisma.reservation.update({
      where: { id },
      data: {
        type,
        customerId: effectiveCustomerId,
        guestName: effectiveGuestName,
        guestPhone:
          dto.guestPhone !== undefined ? dto.guestPhone : existing.guestPhone,
        startAt,
        durationMinutes,
        endAt,
        status: dto.status ?? existing.status,
        pendingNote:
          dto.pendingNote !== undefined
            ? dto.pendingNote
            : existing.pendingNote,
      },
      include: { customer: true },
    });
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.reservation.delete({ where: { id } });
    return { ok: true };
  }

  private assertCustomerOrGuest(
    customerId?: string | null,
    guestName?: string | null,
  ) {
    const hasCustomer = Boolean(customerId);
    const hasGuest = Boolean(guestName && guestName.trim());
    if (hasCustomer === hasGuest) {
      throw new BadRequestException(
        'Informe um cliente cadastrado ou um nome de visitante — nunca os dois, nem nenhum.',
      );
    }
  }

  private async assertCapacity(
    type: ReservationType,
    startAt: Date,
    endAt: Date,
    excludeId?: string,
  ) {
    const capacity = Number(
      this.config.get<string>(CAPACITY_ENV_KEY[type], '0'),
    );

    const overlapping = await this.prisma.reservation.count({
      where: {
        type,
        status: { not: 'canceled' },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    if (overlapping >= capacity) {
      throw new ConflictException(
        `Capacidade de ${TYPE_LABEL[type]} esgotada nesse horário`,
      );
    }
  }

  private async assertExists(id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }
    return reservation;
  }
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}
