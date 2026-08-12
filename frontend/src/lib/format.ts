import type { MachineStatus, MachineType } from "@/types/machine";

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  locked: "Bloqueada",
  time_selection: "Selecionando tempo",
  waiting_pix: "Aguardando Pix",
  active: "Em uso",
  offline: "Offline",
};

export const MACHINE_STATUS_BADGE_CLASS: Record<MachineStatus, string> = {
  locked: "bg-destructive/10 text-destructive",
  time_selection: "bg-accent-4/10 text-accent-4",
  waiting_pix: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  offline: "bg-muted text-muted-foreground",
};

export const MACHINE_TYPE_LABEL: Record<MachineType, string> = {
  pc: "PC",
  console_tv: "Console / TV",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCentsToBRL(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

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
