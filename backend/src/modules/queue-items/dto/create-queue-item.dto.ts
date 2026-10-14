import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateQueueItemDto {
  @IsUUID()
  queueId: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @IsUUID()
  machineId?: string;
}
