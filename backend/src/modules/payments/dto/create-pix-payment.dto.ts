import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreatePixPaymentDto {
  @IsOptional()
  @IsUUID()
  timePackageId?: string;

  @IsOptional()
  @IsUUID()
  hourlyRateId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minutes?: number;
}
