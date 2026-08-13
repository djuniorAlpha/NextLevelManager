import { apiFetch } from "@/lib/api/client";
import type {
  CreateSubscriptionDto,
  CreateSubscriptionResult,
  CustomerSubscription,
} from "@/types/subscription";

export function listAllSubscriptions(): Promise<CustomerSubscription[]> {
  return apiFetch<CustomerSubscription[]>("/subscriptions");
}

export function listCustomerSubscriptions(
  customerId: string,
): Promise<CustomerSubscription[]> {
  return apiFetch<CustomerSubscription[]>(`/customers/${customerId}/subscriptions`);
}

export function createSubscription(
  customerId: string,
  dto: CreateSubscriptionDto,
): Promise<CreateSubscriptionResult> {
  return apiFetch<CreateSubscriptionResult>(
    `/customers/${customerId}/subscriptions`,
    { method: "POST", body: JSON.stringify(dto) },
  );
}

export function cancelSubscription(
  customerId: string,
  subscriptionId: string,
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(
    `/customers/${customerId}/subscriptions/${subscriptionId}/cancel`,
    { method: "POST" },
  );
}
