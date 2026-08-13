export type LoyaltyTier = "bronze" | "prata" | "ouro";

export type TopUpMethod = "cash" | "credit_card" | "debit_card";

export interface Customer {
  id: string;
  name: string;
  username: string;
  mustChangePassword: boolean;
  taxDocument: string | null;
  email: string | null;
  balanceMinutes: number;
  loyaltyTier: LoyaltyTier | null;
  createdAt: string;
}

export interface CreateCustomerDto {
  name: string;
  username: string;
  password: string;
  taxDocument?: string;
  email?: string;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export interface TopUpCustomerDto {
  minutes: number;
  amountCents: number;
  method: TopUpMethod;
}

export interface TopUpCustomerResult {
  customer: Customer;
  payment: {
    id: string;
    amountCents: number;
    method: TopUpMethod;
    paidAt: string | null;
  };
}
