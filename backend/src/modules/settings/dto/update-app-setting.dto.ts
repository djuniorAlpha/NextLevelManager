import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateAppSettingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  pixTokenValidityDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  pixTokenMinRemainingMinutes?: number;
}
