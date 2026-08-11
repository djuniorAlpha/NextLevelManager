import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTimePackageDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsInt()
  @Min(1)
  minutes: number;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
