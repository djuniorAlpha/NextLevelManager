import { apiFetch } from "@/lib/api/client";
import type { AppSetting, UpdateAppSettingDto } from "@/types/pix-token";

export function getAppSettings(): Promise<AppSetting> {
  return apiFetch<AppSetting>("/settings");
}

export function updateAppSettings(
  dto: UpdateAppSettingDto,
): Promise<AppSetting> {
  return apiFetch<AppSetting>("/settings", {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}
