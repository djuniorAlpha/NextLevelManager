import { createAdminCrudApi } from "@/lib/api/admin-crud";
import { apiFetch } from "@/lib/api/client";
import type {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  TopUpCustomerDto,
  TopUpCustomerResult,
} from "@/types/customer";

export const customersApi = createAdminCrudApi<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto
>("/customers");

export function topUpCustomerBalance(
  customerId: string,
  dto: TopUpCustomerDto,
): Promise<TopUpCustomerResult> {
  return apiFetch<TopUpCustomerResult>(`/customers/${customerId}/top-up`, {
    method: "POST",
    body: JSON.stringify(dto),
  });
}
