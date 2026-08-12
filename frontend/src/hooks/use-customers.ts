import { createAdminCrudHooks } from "@/hooks/use-admin-crud";
import { customersApi } from "@/lib/api/customers";
import type {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
} from "@/types/customer";

const hooks = createAdminCrudHooks<Customer, CreateCustomerDto, UpdateCustomerDto>(
  "customers",
  customersApi,
);

export const useCustomers = hooks.useList;
export const useCreateCustomer = hooks.useCreate;
export const useUpdateCustomer = hooks.useUpdate;
export const useRemoveCustomer = hooks.useRemove;
