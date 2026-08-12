export interface TimePackage {
  id: string;
  label: string;
  minutes: number;
  priceCents: number;
  active: boolean;
}

export interface CreateTimePackageDto {
  label: string;
  minutes: number;
  priceCents: number;
}

export type UpdateTimePackageDto = Partial<CreateTimePackageDto> & {
  active?: boolean;
};

export interface HourlyRate {
  id: string;
  label: string;
  ratePerHourCents: number;
  active: boolean;
}

export interface CreateHourlyRateDto {
  label: string;
  ratePerHourCents: number;
}

export type UpdateHourlyRateDto = Partial<CreateHourlyRateDto> & {
  active?: boolean;
};
