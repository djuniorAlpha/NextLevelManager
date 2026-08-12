import { HourlyRatesSection } from "@/components/billing/hourly-rates-section";
import { TimePackagesSection } from "@/components/billing/time-packages-section";

export default function CobrancaPcPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Cobrança PC</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TimePackagesSection />
        <HourlyRatesSection />
      </div>
    </div>
  );
}
