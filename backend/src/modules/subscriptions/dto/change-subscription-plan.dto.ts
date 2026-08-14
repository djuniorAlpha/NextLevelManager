import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  planId: string;
}
