import type { MachineStatus, MachineType } from "@/types/machine";

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  locked: "Bloqueada",
  time_selection: "Selecionando tempo",
  waiting_pix: "Aguardando Pix",
  active: "Em uso",
  offline: "Offline",
};

export const MACHINE_STATUS_BADGE_CLASS: Record<MachineStatus, string> = {
  locked: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  time_selection:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  waiting_pix:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  offline: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const MACHINE_TYPE_LABEL: Record<MachineType, string> = {
  pc: "PC",
  console_tv: "Console / TV",
};

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "nunca";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 5) return "agora";
  if (seconds < 60) return `há ${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;

  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}
