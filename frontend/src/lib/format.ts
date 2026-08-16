import type { MachineStatus, MachineType } from "@/types/machine";
import type { LoyaltyTier } from "@/types/customer";
import type { PdvSaleMethod } from "@/types/pdv";
import type { PaymentPurpose } from "@/types/report";
import type { SubscriptionStatus } from "@/types/subscription";
import type { PixTokenStatus } from "@/types/pix-token";

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

export const LOYALTY_TIER_LABEL: Record<LoyaltyTier, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
};

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export const PDV_SALE_METHOD_LABEL: Record<PdvSaleMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
};

export const PAYMENT_PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  package_purchase: "Pacote de tempo",
  hourly_purchase: "Tarifa por hora",
  wallet_topup: "Recarga de saldo",
  subscription: "Assinatura",
  console_session: "Sessão de console",
  product_sale: "PDV",
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending: "Aguardando pagamento",
  active: "Ativa",
  canceled: "Cancelada",
  past_due: "Pagamento atrasado",
};

export const SUBSCRIPTION_STATUS_BADGE_CLASS: Record<SubscriptionStatus, string> = {
  pending: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  canceled: "bg-muted text-muted-foreground",
  past_due: "bg-destructive/10 text-destructive",
};

export const PIX_TOKEN_STATUS_LABEL: Record<PixTokenStatus, string> = {
  active: "Ativo",
  expired: "Expirado",
  exhausted: "Esgotado",
};

export const PIX_TOKEN_STATUS_BADGE_CLASS: Record<PixTokenStatus, string> = {
  active: "bg-success/10 text-success",
  expired: "bg-muted text-muted-foreground",
  exhausted: "bg-destructive/10 text-destructive",
};

export function formatSeconds(totalSeconds: number): string {
  return formatMinutes(Math.round(Math.max(0, totalSeconds) / 60));
}

export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
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
