import { FinancialReportSection } from "@/components/reports/financial-report-section";

export default function FinanceiroPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Financeiro</h1>
      <FinancialReportSection />
    </div>
  );
}
