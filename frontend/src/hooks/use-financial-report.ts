import { useQuery } from "@tanstack/react-query";
import { getFinancialReport } from "@/lib/api/reports";

export function useFinancialReport(from: string, to: string) {
  return useQuery({
    queryKey: ["financial-report", from, to],
    queryFn: () => getFinancialReport(from, to),
  });
}
