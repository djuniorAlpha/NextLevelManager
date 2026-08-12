import { apiFetch } from "@/lib/api/client";
import type { ForceAction, Machine } from "@/types/machine";

export function getMachines(): Promise<Machine[]> {
  return apiFetch<Machine[]>("/machines");
}

const FORCE_ACTION_PATH: Record<ForceAction, string> = {
  lock: "force-lock",
  unlock: "force-unlock",
  shutdown: "force-shutdown",
};

export function forceMachineAction(
  machineId: string,
  action: ForceAction,
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(
    `/machines/${machineId}/${FORCE_ACTION_PATH[action]}`,
    { method: "POST" },
  );
}
