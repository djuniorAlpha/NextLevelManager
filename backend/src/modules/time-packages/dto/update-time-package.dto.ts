import { PartialType } from '@nestjs/mapped-types';
import { CreateTimePackageDto } from './create-time-package.dto';

export class UpdateTimePackageDto extends PartialType(CreateTimePackageDto) {}
