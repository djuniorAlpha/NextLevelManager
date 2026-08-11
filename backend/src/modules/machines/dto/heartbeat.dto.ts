import { IsEnum } from 'class-validator';
import { MachineStatus } from '@prisma/client';

export class HeartbeatDto {
  @IsEnum(MachineStatus)
  currentStatus: MachineStatus;
}
