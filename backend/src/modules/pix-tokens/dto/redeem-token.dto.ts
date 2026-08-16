import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemTokenDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
