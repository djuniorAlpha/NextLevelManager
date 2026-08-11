import { PartialType } from '@nestjs/mapped-types';
import { CreateHourlyRateDto } from './create-hourly-rate.dto';

export class UpdateHourlyRateDto extends PartialType(CreateHourlyRateDto) {}
