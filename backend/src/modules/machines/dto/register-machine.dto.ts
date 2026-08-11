import { IsIP, IsNotEmpty, IsString } from 'class-validator';

export class RegisterMachineDto {
  @IsString()
  @IsNotEmpty()
  macAddress: string;

  @IsString()
  @IsNotEmpty()
  hostname: string;

  @IsIP()
  ipAddress: string;
}
