import { ProductsSection } from "@/components/pdv/products-section";
import { SalesHistorySection } from "@/components/pdv/sales-history-section";

export default function PdvPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">PDV</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProductsSection />
        <SalesHistorySection />
      </div>
    </div>
  );
}
