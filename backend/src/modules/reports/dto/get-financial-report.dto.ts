import { IsDateString } from 'class-validator';

export class GetFinancialReportDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
