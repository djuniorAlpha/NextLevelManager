import type { PdvSaleMethod } from "@/types/pdv";

export type PaymentPurpose =
  | "package_purchase"
  | "hourly_purchase"
  | "wallet_topup"
  | "subscription"
  | "console_session"
  | "product_sale";

export interface FinancialReportMethodBreakdown {
  method: PdvSaleMethod;
  totalCents: number;
  count: number;
}

export interface FinancialReportPurposeBreakdown {
  purpose: PaymentPurpose;
  totalCents: number;
  count: number;
}

export interface FinancialReport {
  from: string;
  to: string;
  totalCents: number;
  paymentCount: number;
  averageTicketCents: number;
  byMethod: FinancialReportMethodBreakdown[];
  byPurpose: FinancialReportPurposeBreakdown[];
}
