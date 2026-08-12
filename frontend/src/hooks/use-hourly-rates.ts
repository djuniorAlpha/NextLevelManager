import { createAdminCrudApi } from "@/lib/api/admin-crud";
import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import type {
  CreateHourlyRateDto,
  HourlyRate,
  UpdateHourlyRateDto,
} from "@/types/billing";

const api = createAdminCrudApi<
  HourlyRate,
  CreateHourlyRateDto,
  UpdateHourlyRateDto
>("/hourly-rates");

const hooks = createAdminCrudHooks("hourly-rates", api);

export const useHourlyRates = hooks.useList;
export const useCreateHourlyRate = hooks.useCreate;
export const useUpdateHourlyRate = hooks.useUpdate;
export const useRemoveHourlyRate = hooks.useRemove;
