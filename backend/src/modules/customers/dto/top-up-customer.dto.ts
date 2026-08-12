import { IsIn, IsInt, Min } from 'class-validator';

const TOP_UP_METHODS = ['cash', 'credit_card', 'debit_card'] as const;

export type TopUpMethod = (typeof TOP_UP_METHODS)[number];

export class TopUpCustomerDto {
  @IsInt()
  @Min(1)
  minutes: number;

  @IsInt()
  @Min(0)
  amountCents: number;

  @IsIn(TOP_UP_METHODS)
  method: TopUpMethod;
}
