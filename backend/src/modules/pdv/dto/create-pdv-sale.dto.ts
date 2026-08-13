import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PdvSaleItemDto } from './pdv-sale-item.dto';

const PDV_SALE_METHODS = ['pix', 'credit_card', 'debit_card', 'cash'] as const;

export type PdvSaleMethod = (typeof PDV_SALE_METHODS)[number];

export class CreatePdvSaleDto {
  @ValidateNested({ each: true })
  @Type(() => PdvSaleItemDto)
  @ArrayMinSize(1)
  items: PdvSaleItemDto[];

  @IsIn(PDV_SALE_METHODS)
  method: PdvSaleMethod;

  @IsOptional()
  @IsString()
  customerId?: string;
}
