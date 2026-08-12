import { CustomersSection } from "@/components/customers/customers-section";

export default function ClientesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Clientes</h1>
      <CustomersSection />
    </div>
  );
}
