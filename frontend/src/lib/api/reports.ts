import { apiFetch } from "@/lib/api/client";
import type { FinancialReport } from "@/types/report";

export function getFinancialReport(
  from: string,
  to: string,
): Promise<FinancialReport> {
  const params = new URLSearchParams({ from, to });
  return apiFetch<FinancialReport>(`/reports/financial?${params.toString()}`);
}
