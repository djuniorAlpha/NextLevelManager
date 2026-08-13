export type PdvSaleMethod = "pix" | "credit_card" | "debit_card" | "cash";

export interface CreatePdvSaleDto {
  items: { productId: string; quantity: number }[];
  method: PdvSaleMethod;
  customerId?: string;
}

export interface PdvSaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  discountPercentApplied: number | null;
  product: { id: string; name: string };
}

export interface PdvSale {
  id: string;
  totalCents: number;
  createdAt: string;
  customerId: string | null;
  customer: { id: string; name: string } | null;
  items: PdvSaleItem[];
  payment: { id: string; method: PdvSaleMethod; paidAt: string | null };
}
