import { IsString, MinLength } from 'class-validator';

export class CustomerLoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(1)
  password: string;
}
