import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;
}
