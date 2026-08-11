import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHourlyRateDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsInt()
  @Min(0)
  ratePerHourCents: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
