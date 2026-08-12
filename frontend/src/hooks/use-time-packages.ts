import { createAdminCrudApi } from "@/lib/api/admin-crud";
import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import type {
  CreateTimePackageDto,
  TimePackage,
  UpdateTimePackageDto,
} from "@/types/billing";

const api = createAdminCrudApi<
  TimePackage,
  CreateTimePackageDto,
  UpdateTimePackageDto
>("/time-packages");

const hooks = createAdminCrudHooks("time-packages", api);

export const useTimePackages = hooks.useList;
export const useCreateTimePackage = hooks.useCreate;
export const useUpdateTimePackage = hooks.useUpdate;
export const useRemoveTimePackage = hooks.useRemove;
