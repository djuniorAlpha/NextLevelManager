export type SubscriptionStatus = "pending" | "active" | "canceled" | "past_due";

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceCents: number;
  billingInterval: string;
  includedMinutes: number | null;
  discountPercent: number | null;
  pdvDiscountPercent: number | null;
  maxActiveSubscribers: number | null;
  perks: string[];
  active: boolean;
}

export interface CreateSubscriptionPlanDto {
  name: string;
  priceCents: number;
  includedMinutes?: number;
  pdvDiscountPercent?: number;
  maxActiveSubscribers?: number;
  perks?: string[];
}

export type UpdateSubscriptionPlanDto = Partial<CreateSubscriptionPlanDto> & {
  active?: boolean;
};

export interface CustomerSubscription {
  id: string;
  customerId: string;
  customer?: { id: string; name: string };
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  mercadoPagoPreapprovalId: string | null;
  includedMinutesRemaining: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface CreateSubscriptionDto {
  planId: string;
  payerEmail?: string;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  checkoutUrl: string | null;
}
