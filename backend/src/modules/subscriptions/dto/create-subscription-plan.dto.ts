import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  priceCents: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  includedMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  pdvDiscountPercent?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxActiveSubscribers?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[];
}
